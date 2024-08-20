"use client";

import { useChat, Message } from "ai/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendIcon } from "lucide-react";
import MessageList from "@/components/MessageList";

export default function ChatBox({
	chatId,
	initialMessages = [],
}: {
	chatId: number;
	initialMessages: Message[];
}) {
	const { messages, input, isLoading, handleInputChange, handleSubmit } =
		useChat({
			keepLastMessageOnError: true,
			body: {
				chatId,
			},
			initialMessages,
		});

	return (
		<div className="relative flex flex-col w-full h-full overflow-y-scroll">
			<div className="sticky top-o inset-x-0 p-2 bg-white h-fit">
				<h3 className="text-xl font-bold">Chat</h3>
			</div>

			<div className="mt-auto">
				<MessageList messages={messages} />
			</div>

			<form
				onSubmit={handleSubmit}
				className="sticky bottom-0 inset-x-0 px-2 py-4 bg-white"
			>
				<div className="flex">
					<Input
						value={input}
						onChange={handleInputChange}
						placeholder="Ask any questions..."
						className="w-full"
					/>
					<Button className="bg-blue-400 ml-2" disabled={isLoading}>
						<SendIcon className="h-4 w-4" />
					</Button>
				</div>
			</form>
		</div>
	);
}
