import { NextResponse } from "next/server";
import { getSurveyCountByStatus } from "@/db/services";
import { SurveyStatus, surveyStatusEnum } from "@/db/schema/survey";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    let status: SurveyStatus | undefined;
    if (statusParam) {
      if (!surveyStatusEnum.enumValues.includes(statusParam as SurveyStatus)) {
        console.error("Invalid status parameter:", statusParam);
        return NextResponse.json({ error: "Invalid status parameter" }, { status: 400 });
      }
      status = statusParam as SurveyStatus;
    }

    const count = await getSurveyCountByStatus(status);

    return NextResponse.json({
      count,
    });
  } catch (error) {
    console.error("Error fetching survey data:", error);
    return NextResponse.json({ error: "Failed to fetch survey data" }, { status: 500 });
  }
}
