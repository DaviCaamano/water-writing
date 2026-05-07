CREATE TABLE "document_content" (
	"document_id" uuid PRIMARY KEY NOT NULL,
	"body" "bytea" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_content" ADD CONSTRAINT "document_content_document_id_documents_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("document_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "body";