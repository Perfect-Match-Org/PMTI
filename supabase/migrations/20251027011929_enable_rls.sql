-- Enable RLS on tables that need realtime updates
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_type_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policy for invitations table
-- Users can see invitations they sent or received
CREATE POLICY "Users can view their invitations"
ON invitations
FOR SELECT
USING (
  (auth.jwt() ->> 'email') = "fromUserEmail" 
  OR (auth.jwt() ->> 'email') = "toUserEmail"
);

-- RLS Policy for surveys table  
-- Users can see surveys they're participating in (check via survey_participants)
CREATE POLICY "Users can view their surveys"
ON surveys
FOR SELECT
USING (
  id IN (
    SELECT "surveyId" 
    FROM survey_participants 
    WHERE "user1Email" = (auth.jwt() ->> 'email') 
       OR "user2Email" = (auth.jwt() ->> 'email')
  )
);

-- Allow updates for survey participants
CREATE POLICY "Users can update their surveys"
ON surveys
FOR UPDATE
USING (
  id IN (
    SELECT "surveyId" 
    FROM survey_participants 
    WHERE "user1Email" = (auth.jwt() ->> 'email') 
       OR "user2Email" = (auth.jwt() ->> 'email')
  )
);

-- RLS Policy for survey_participants
CREATE POLICY "Users can view survey participants"
ON survey_participants
FOR SELECT
USING (
  "user1Email" = (auth.jwt() ->> 'email') 
  OR "user2Email" = (auth.jwt() ->> 'email')
);
