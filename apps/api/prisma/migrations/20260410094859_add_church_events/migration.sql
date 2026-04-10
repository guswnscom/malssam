-- CreateTable
CREATE TABLE "church_events" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "date" DATE NOT NULL,
    "end_date" DATE,
    "event_type" VARCHAR(20) NOT NULL DEFAULT 'CUSTOM',
    "worship_type" VARCHAR(20),
    "needs_sermon" BOOLEAN NOT NULL DEFAULT false,
    "sermon_id" UUID,
    "scripture" VARCHAR(100),
    "description" TEXT,
    "reminder_days" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "color" VARCHAR(7),
    "is_liturgical" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "church_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "church_events_church_id_date_idx" ON "church_events"("church_id", "date");

-- AddForeignKey
ALTER TABLE "church_events" ADD CONSTRAINT "church_events_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "church_events" ADD CONSTRAINT "church_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
