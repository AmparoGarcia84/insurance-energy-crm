-- Enforce uniqueness of NIF/CIF (NULLs are always allowed)
CREATE UNIQUE INDEX "Client_nif_key" ON "Client"("nif");
