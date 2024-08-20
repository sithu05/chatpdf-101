"use server";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { getFileUrl } from "@/lib/s3";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import os from "os";
import fetch from "node-fetch";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { PineconeStore } from "@langchain/pinecone";
import { pc } from "@/lib/pinecone";

export async function createChat(payload: {
	file_key: string;
	file_name: string;
}) {
	const { userId } = auth();

	if (!userId) {
		throw new Error("Unauthorized Error");
	}

	try {
		const fileUrl = getFileUrl(payload.file_key);

		// Fetch the file from the URL
		const response = await fetch(fileUrl);

		if (!response.ok) {
			throw new Error(`Failed to download file: ${response.statusText}`);
		}

		// Convert the array buffer to a Node.js buffer
		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Generate a local temporary file path
		const tempFilePath = join(os.tmpdir(), payload.file_name);

		// Write the buffer to the local filesystem
		writeFileSync(tempFilePath, buffer);

		// Use PDFLoader with the local file path
		const loader = new PDFLoader(tempFilePath);
		const docs = await loader.load();

		// Split the text into smaller chunks
		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000, // Maximum number of characters per chunk
			chunkOverlap: 200, // Number of characters overlapping between chunks
		});

		const chunks = await splitter.splitDocuments(docs);

		// Generate embeddings for each chunk using OpenAIEmbeddings
		const embeddings = new OpenAIEmbeddings({
			modelName: "text-embedding-ada-002", // Replace with the embedding model you prefer,
			apiKey: process.env.OPENAI_API_KEY,
		});

		const pineconeIndex = pc.Index(process.env.PINECONE_INDEX!);

		const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
			pineconeIndex,
			maxConcurrency: 5,
			namespace: payload.file_key.replaceAll(/[^\x00-\x7F]/g, ""),
		});

		await vectorStore.addDocuments(chunks);

		// Optionally, clean up the temporary file after processing
		unlinkSync(tempFilePath);

		// Save to DB
		const chat_id = await db
			.insert(chats)
			.values({
				fileKey: payload.file_key,
				pdfName: payload.file_name,
				pdfUrl: fileUrl,
				userId: userId,
			})
			.returning({
				insertId: chats.id,
			});

		return chat_id[0].insertId;
	} catch (err) {
		console.error(err);
	}
}
