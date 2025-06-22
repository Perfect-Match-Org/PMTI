import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Survey from "@/db/models/survey";

export async function GET() {
  try {
    await dbConnect();
    
    const completedSurveyCount = await Survey.countDocuments({ 
      status: "completed" 
    });
    
    return NextResponse.json({ 
      count: completedSurveyCount 
    });
  } catch (error) {
    console.error("Error fetching survey count:", error);
    return NextResponse.json(
      { error: "Failed to fetch survey count" },
      { status: 500 }
    );
  }
}