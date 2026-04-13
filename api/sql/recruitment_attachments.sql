-- Recruitment Attachments Table
CREATE TABLE dbo.RecruitmentAttachments (
    RecruitmentId NVARCHAR(30) NOT NULL,
    AttachmentType NVARCHAR(50) NOT NULL,
    AttachmentImage VARBINARY(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_RecruitmentAttachments PRIMARY KEY (RecruitmentId, AttachmentType)
);
-- Add foreign key if needed:
-- ALTER TABLE dbo.RecruitmentAttachments ADD CONSTRAINT FK_Recruitment_Attachments FOREIGN KEY (RecruitmentId) REFERENCES dbo.Recruitment(RecruitmentId);
