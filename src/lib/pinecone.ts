import { Pinecone } from "@pinecone-database/pinecone";
import { generateEmbedding } from "@/lib/ai/embedding";

export const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

export const findRelevantContent = async (query: string, namespace: string) => {
	const index = pc.Index(process.env.PINECONE_INDEX!);

	const queryResponse = await index.namespace(namespace).query({
		vector: await generateEmbedding(query),
		topK: 3,
		includeMetadata: true,
	});

	const matches = queryResponse.matches.filter(
		(matched) => matched.score && matched.score > 0.7,
	);

	return matches
		.map((matched) => matched.metadata?.text)
		.join("\n")
		.substring(0, 3000);
};
