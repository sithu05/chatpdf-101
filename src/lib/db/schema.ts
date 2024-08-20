import {
	pgTable,
	serial,
	varchar,
	text,
	timestamp,
	integer,
	pgEnum,
} from "drizzle-orm/pg-core";

export const type = pgEnum("user_system_enum", ["user", "system"]);

export const chats = pgTable("chats", {
	id: serial("id").primaryKey(),
	pdfName: text("pdf_name").notNull(),
	pdfUrl: text("pdf_url").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	userId: varchar("user_id", { length: 256 }).notNull(),
	fileKey: text("file_key").notNull(),
});

export const messages = pgTable("messages", {
	id: serial("id").primaryKey(),
	chatId: integer("chat_id")
		.references(() => chats.id)
		.notNull(),
	content: text("content").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	type: type("type").notNull(),
});
