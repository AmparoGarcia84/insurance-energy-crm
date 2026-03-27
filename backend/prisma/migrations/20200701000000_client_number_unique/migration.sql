-- Enforce uniqueness of clientNumber (NULLs are always allowed)
CREATE UNIQUE INDEX "Client_clientNumber_key" ON "Client"("clientNumber");
