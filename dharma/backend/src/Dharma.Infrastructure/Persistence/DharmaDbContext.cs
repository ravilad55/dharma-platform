using Dharma.SharedKernel.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace Dharma.Infrastructure.Persistence;

public sealed class DharmaDbContext(DbContextOptions<DharmaDbContext> options) : DbContext(options), IUnitOfWork
{
    public DbSet<OutboxRecord> Outbox => Set<OutboxRecord>();
    public DbSet<InboxRecord> Inbox => Set<InboxRecord>();
    public DbSet<IdentityUserRecord> IdentityUsers => Set<IdentityUserRecord>();
    public DbSet<IdentityCustomerProfileRecord> IdentityCustomerProfiles => Set<IdentityCustomerProfileRecord>();
    public DbSet<IdentityOtpChallengeRecord> IdentityOtpChallenges => Set<IdentityOtpChallengeRecord>();
    public DbSet<IdentitySessionRecord> IdentitySessions => Set<IdentitySessionRecord>();
    public DbSet<IdentityRefreshTokenRecord> IdentityRefreshTokens => Set<IdentityRefreshTokenRecord>();
    public DbSet<IdentityRoleRecord> IdentityRoles => Set<IdentityRoleRecord>();
    public DbSet<IdentityUserRoleRecord> IdentityUserRoles => Set<IdentityUserRoleRecord>();
    public DbSet<AuthAuditEventRecord> AuthAuditEvents => Set<AuthAuditEventRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OutboxRecord>(entity =>
        {
            entity.ToTable("outbox_messages");
            entity.HasKey(message => message.Id);
            entity.Property(message => message.EventType).HasMaxLength(250).IsRequired();
            entity.Property(message => message.Payload).IsRequired();
            entity.Property(message => message.IdempotencyKey).HasMaxLength(250);
            entity.HasIndex(message => new { message.PublishedAt, message.OccurredAt });
        });

        modelBuilder.Entity<InboxRecord>(entity =>
        {
            entity.ToTable("inbox_messages");
            entity.HasKey(message => new { message.EventId, message.Consumer });
            entity.Property(message => message.Consumer).HasMaxLength(250);
        });

        modelBuilder.Entity<IdentityUserRecord>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PhoneNormalized).HasMaxLength(32).IsRequired();
            entity.Property(x => x.PhoneLookupHash).HasMaxLength(128).IsRequired();
            entity.Property(x => x.DisplayName).HasMaxLength(200);
            entity.Property(x => x.CreatedBy).HasMaxLength(100);
            entity.Property(x => x.UpdatedBy).HasMaxLength(100);
            entity.HasIndex(x => x.PhoneNormalized).IsUnique();
            entity.HasIndex(x => x.PhoneLookupHash).IsUnique();
        });

        modelBuilder.Entity<IdentityCustomerProfileRecord>(entity =>
        {
            entity.ToTable("customer_profiles");
            entity.HasKey(x => x.UserId);
            entity.Property(x => x.Preferences).HasMaxLength(4000);
            entity.HasOne<IdentityUserRecord>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IdentityOtpChallengeRecord>(entity =>
        {
            entity.ToTable("otp_challenges");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PhoneNormalized).HasMaxLength(32).IsRequired();
            entity.Property(x => x.CodeHash).HasMaxLength(512).IsRequired();
            entity.HasIndex(x => new { x.PhoneNormalized, x.CreatedAt });
            entity.HasIndex(x => new { x.State, x.ExpiresAt });
        });

        modelBuilder.Entity<IdentitySessionRecord>(entity =>
        {
            entity.ToTable("sessions");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.UserId, x.State, x.LastSeenAt });
            entity.HasIndex(x => new { x.FamilyId, x.State });
            entity.HasOne<IdentityUserRecord>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<IdentityRefreshTokenRecord>(entity =>
        {
            entity.ToTable("refresh_token_nodes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            entity.HasIndex(x => x.TokenHash).IsUnique();
            entity.HasIndex(x => new { x.FamilyId, x.ExpiresAt });
            entity.HasOne<IdentitySessionRecord>().WithMany().HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IdentityRoleRecord>(entity =>
        {
            entity.ToTable("roles");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).HasMaxLength(50).IsRequired();
            entity.HasIndex(x => x.Code).IsUnique();
        });

        modelBuilder.Entity<IdentityUserRoleRecord>(entity =>
        {
            entity.ToTable("user_roles");
            entity.HasKey(x => new { x.UserId, x.RoleId });
            entity.HasOne<IdentityUserRecord>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<IdentityRoleRecord>().WithMany().HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AuthAuditEventRecord>(entity =>
        {
            entity.ToTable("auth_audit_events");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.EventType).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Outcome).HasMaxLength(50).IsRequired();
            entity.Property(x => x.CorrelationId).HasMaxLength(100).IsRequired();
            entity.Property(x => x.SafeMetadata).HasMaxLength(1000);
            entity.HasIndex(x => new { x.UserId, x.OccurredAt });
            entity.HasIndex(x => new { x.EventType, x.OccurredAt });
            entity.HasIndex(x => x.CorrelationId);
        });
    }
}

public sealed class OutboxRecord
{
    public Guid Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public DateTimeOffset OccurredAt { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
    public string? IdempotencyKey { get; set; }
}

public sealed class InboxRecord
{
    public Guid EventId { get; set; }
    public string Consumer { get; set; } = string.Empty;
    public DateTimeOffset ProcessedAt { get; set; }
}
