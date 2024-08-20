import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export async function uploadFile(file: File) {
	const client = new S3Client({
		forcePathStyle: true,
		region: process.env.NEXT_PUBLIC_REGION!,
		endpoint: process.env.NEXT_PUBLIC_ENDPOINT_URL!,
		credentials: {
			accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
			secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
		},
	});

	const FileKey =
		"uploads/" + Date.now().toString() + "-" + file.name.replaceAll(" ", "-");

	const command = new PutObjectCommand({
		Bucket: "pdf",
		Key: FileKey,
		Body: file,
	});

	try {
		await client.send(command);

		return {
			file_key: FileKey,
			file_name: file.name,
		};
	} catch (err) {
		console.error(err);
	}
}

export function getFileUrl(file_key: string) {
	return `https://${process.env.NEXT_PUBLIC_PROJECT_ID}.supabase.co/storage/v1/object/public/pdf/${file_key}`;
}
