"use client";

import { useDropzone } from "react-dropzone";
import { Inbox, Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/s3";
import toast from "react-hot-toast";
import { useState, useTransition } from "react";
import { createChat } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function FileUpload() {
	const [isUploading, setIsUploading] = useState(false);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const { getRootProps, getInputProps } = useDropzone({
		accept: { "application/pdf": [".pdf"] },
		maxFiles: 1,
		maxSize: 10 * 1024 * 1024,
		onDrop: async (acceptedFiles: File[]) => {
			try {
				setIsUploading(true);
				const data = await uploadFile(acceptedFiles[0]);

				if (!data) {
					toast.error("Upload failed.");
					return;
				}

				startTransition(async () => {
					const createdId = await createChat(data);

					if (createdId) {
						toast.success("Chat was created successfully.", {
							position: "top-right",
						});

						router.push(`/chat/${createdId}`);
					}
				});
			} catch (error) {
			} finally {
				setIsUploading(false);
			}
		},
	});

	return (
		<div className="p-2 bg-white rounded-xl">
			<div
				{...getRootProps({
					className:
						"border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col",
				})}
			>
				<input {...getInputProps()} />
				{isPending || isUploading ? (
					<>
						<Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
						<p className="mt-2 text-sm text-slate-400">
							Spilling Tea to GPT...
						</p>
					</>
				) : (
					<>
						<Inbox className="w-10 h-10 text-blue-500" />
						<p className="mt-2 text-sm text-slate-400">Drop PDF Here</p>
					</>
				)}
			</div>
		</div>
	);
}
