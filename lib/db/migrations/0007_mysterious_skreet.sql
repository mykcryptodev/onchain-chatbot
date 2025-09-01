DO $$ BEGIN
 ALTER TABLE "User" ADD COLUMN "walletAddress" varchar(42);
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;