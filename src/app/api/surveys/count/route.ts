import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Survey from "@/db/models/survey";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const filter = status ? { status } : {};
    const surveyCount = await Survey.countDocuments(filter);

    return NextResponse.json({
      count: surveyCount,
    });
  } catch (error) {
    console.error("Error fetching survey data:", error);
    return NextResponse.json({ error: "Failed to fetch survey data" }, { status: 500 });
  }
}
