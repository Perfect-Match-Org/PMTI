-- Optimized JSONB approach for auto-incrementing currentQuestionIndex
-- Uses JSONB operators instead of loops for better performance
-- Only triggers when participant_status column changes

-- Add GIN index for faster JSONB queries on participant_status
CREATE INDEX IF NOT EXISTS surveys_participant_status_gin_idx ON surveys USING GIN (participant_status);

CREATE OR REPLACE FUNCTION auto_increment_question_index()
RETURNS TRIGGER AS $$
DECLARE
    submitted_count INTEGER;
    total_participants INTEGER;
BEGIN
    -- Count total participants in participant_status
    SELECT COUNT(*) INTO total_participants
    FROM jsonb_each(NEW.participant_status);

    -- Validate exactly 2 participants (fail-fast with clear error)
    IF total_participants != 2 THEN
        RAISE EXCEPTION 'Survey participant_status corrupted: expected exactly 2 participants but found %', total_participants
            USING HINT = 'Check survey initialization logic',
                  ERRCODE = 'check_violation';
    END IF;

    -- Count submitted participants
    SELECT COUNT(*) INTO submitted_count
    FROM jsonb_each(NEW.participant_status)
    WHERE (value->>'hasSubmitted')::BOOLEAN = TRUE;

    -- Early exit if both haven't submitted
    IF submitted_count != 2 THEN
        RETURN NEW;
    END IF;

    -- Increment question index and update timestamp
    NEW.current_question_index := NEW.current_question_index + 1;
    NEW.last_activity_at := NOW();

    -- Reset hasSubmitted to false for all participants
    NEW.participant_status := (
        SELECT jsonb_object_agg(
            key,
            jsonb_set(value, '{hasSubmitted}', 'false'::jsonb)
        )
        FROM jsonb_each(NEW.participant_status)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_increment_question_trigger ON surveys;

-- Create trigger that ONLY fires when participant_status column changes
CREATE TRIGGER auto_increment_question_trigger
    BEFORE UPDATE OF participant_status ON surveys
    FOR EACH ROW
    WHEN (OLD.participant_status IS DISTINCT FROM NEW.participant_status)
    EXECUTE FUNCTION auto_increment_question_index();

-- Add comment for documentation
COMMENT ON FUNCTION auto_increment_question_index() IS
'Auto-increments currentQuestionIndex when both participants have hasSubmitted: true. Validates exactly 2 participants to prevent race conditions. Uses JSONB operators for efficiency and resets hasSubmitted to false after incrementing.';