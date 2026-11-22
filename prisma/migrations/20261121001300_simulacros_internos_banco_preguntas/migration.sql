-- Extensión aditiva; no elimina ni altera datos preexistentes.
CREATE TABLE "PracticeTopicState" (
 "code" TEXT NOT NULL,
 "published" BOOLEAN NOT NULL DEFAULT false,
 "publishedAt" TIMESTAMP(3),
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "PracticeTopicState_pkey" PRIMARY KEY ("code")
);
CREATE TABLE "PracticeQuestion" (
 "id" TEXT NOT NULL,
 "topicCode" TEXT NOT NULL,
 "statement" TEXT NOT NULL,
 "optionA" TEXT NOT NULL,
 "optionB" TEXT NOT NULL,
 "optionC" TEXT NOT NULL,
 "optionD" TEXT NOT NULL,
 "correctOption" TEXT NOT NULL,
 "active" BOOLEAN NOT NULL DEFAULT true,
 "createdBy" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "PracticeQuestion_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "PracticeQuestion_correctOption_check" CHECK ("correctOption" IN ('A','B','C','D'))
);
CREATE INDEX "PracticeQuestion_topicCode_active_createdAt_idx" ON "PracticeQuestion"("topicCode","active","createdAt");
CREATE TABLE "PracticeMaterial" (
 "id" TEXT NOT NULL,
 "topicCode" TEXT NOT NULL,
 "title" TEXT NOT NULL,
 "content" TEXT,
 "url" TEXT,
 "evidenceKey" TEXT,
 "vehicleType" TEXT,
 "createdBy" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "PracticeMaterial_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PracticeMaterial_topicCode_createdAt_idx" ON "PracticeMaterial"("topicCode","createdAt");
CREATE TABLE "PracticeAttempt" (
 "id" TEXT NOT NULL,
 "clientEventId" TEXT NOT NULL,
 "topicCode" TEXT NOT NULL,
 "workerId" TEXT NOT NULL,
 "answers" JSONB NOT NULL,
 "correctCount" INTEGER NOT NULL,
 "totalQuestions" INTEGER NOT NULL,
 "score" INTEGER NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "PracticeAttempt_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "PracticeAttempt_score_check" CHECK ("score" >= 0 AND "score" <= 100)
);
CREATE UNIQUE INDEX "PracticeAttempt_clientEventId_key" ON "PracticeAttempt"("clientEventId");
CREATE INDEX "PracticeAttempt_workerId_topicCode_createdAt_idx" ON "PracticeAttempt"("workerId","topicCode","createdAt");
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
