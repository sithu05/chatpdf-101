import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText, tool } from "ai";
import { findRelevantContent, pc } from "@/lib/pinecone";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
	const { messages, chatId } = await req.json();
	const records = await db.select().from(chats).where(eq(chats.id, chatId));

	if (records.length === 0) {
		return NextResponse.json({}, { status: 404 });
	}

	try {
		const fileKey = records[0].fileKey;

		const result = await streamText({
			model: openai("gpt-3.5-turbo"),
			system: "You are a helpful assistant.",
			temperature: 1.0,
			tools: {
				getInformation: tool({
					description: `get information from your knowledge base to answer questions.`,
					parameters: z.object({
						question: z.string().describe("the users question"),
					}),
					execute: async ({ question }) => {
						await db.insert(_messages).values({
							chatId,
							content: question,
							type: "user",
						});

						return findRelevantContent(
							question,
							fileKey.replaceAll(/[^\x00-\x7F]/g, ""),
						);
					},
				}),
			},
			messages: convertToCoreMessages(messages),
			onFinish: async (event) => {
				await db.insert(_messages).values({
					chatId,
					content: event.text,
					type: "system",
				});
			},
		});

		return result.toDataStreamResponse();
	} catch (err) {
		console.error(err);
	}
}
