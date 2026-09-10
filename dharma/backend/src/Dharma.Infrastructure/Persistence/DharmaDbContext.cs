using Dharma.SharedKernel.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace Dharma.Infrastructure.Persistence;

public sealed class DharmaDbContext(DbContextOptions<DharmaDbContext> options) : DbContext(options), IUnitOfWork
{
    public DbSet<OutboxRecord> Outbox => Set<OutboxRecord>();
    public DbSet<InboxRecord> Inbox => Set<InboxRecord>();

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
