-- Users table for HR API
-- WARNING: Passwords are stored in plain text per request. This is insecure in production.
CREATE TABLE dbo.Users (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Username NVARCHAR(100) NOT NULL UNIQUE,
  Password NVARCHAR(200) NOT NULL,
  FullName NVARCHAR(200) NULL,
  Email NVARCHAR(200) NULL,
  Role NVARCHAR(50) NULL,
  Phone NVARCHAR(50) NULL,
  Department NVARCHAR(100) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

-- Optional: create an index for role lookups
CREATE INDEX IX_Users_Role ON dbo.Users(Role);

-- Example insert (remove in production)
-- INSERT INTO dbo.Users (Username, Password, FullName, Email, Role) VALUES ('admin', 'Admin@123', 'Administrator', 'admin@example.com', 'Admin');
