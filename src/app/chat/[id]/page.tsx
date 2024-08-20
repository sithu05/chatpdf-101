import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { chats, messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ChatSidebar from "@/components/ChatSidebar";
import PDFViewer from "@/components/PDFViewer";
import { getFileUrl } from "@/lib/s3";
import ChatBox from "@/components/ChatBox";

export default async function ChatPage({ params }: { params: { id: string } }) {
	const { userId } = auth();

	if (!userId) {
		return redirect(`/sign-in`);
	}

	const data = await db.select().from(chats).where(eq(chats.userId, userId));

	const current = data.find((chat) => chat.id === parseInt(params.id));

	if (!current) {
		return redirect(`/`);
	}

	const conversation = await db
		.select()
		.from(messages)
		.where(eq(messages.chatId, parseInt(params.id)));

	return (
		<div className="w-full h-screen">
			<div className="grid grid-cols-12 h-full">
				<div className="col-span-2 bg-white w-full h-full">
					<ChatSidebar chats={data} chatId={parseInt(params.id)} />
				</div>
				<div className="col-span-5">
					<PDFViewer src={getFileUrl(current.fileKey)} />
				</div>
				<div className="col-span-5 relative">
					<ChatBox
						chatId={parseInt(params.id)}
						initialMessages={conversation.map((message) => ({
							...message,
							id: message.id.toString(),
							role: message.type,
						}))}
					/>
				</div>
			</div>
		</div>
	);
}
