ALTER TABLE "users" ADD COLUMN "last_viewed_document_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_last_viewed_document_id_documents_document_id_fk" FOREIGN KEY ("last_viewed_document_id") REFERENCES "public"."documents"("document_id") ON DELETE set null ON UPDATE no action;
