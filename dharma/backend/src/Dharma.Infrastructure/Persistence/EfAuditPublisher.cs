using Dharma.Identity.Application;
using Dharma.Identity.Domain;
using Microsoft.EntityFrameworkCore;

namespace Dharma.Infrastructure.Persistence;

public sealed class EfAuditPublisher(DharmaDbContext dbContext) : IAuditPublisher
{
    public async Task PublishAsync(AuthAuditEvent auditEvent, CancellationToken cancellationToken = default)
    {
        var record = new AuthAuditEventRecord
        {
            Id = auditEvent.Id,
            EventType = auditEvent.EventType,
            UserId = auditEvent.UserId,
            SessionId = auditEvent.SessionId,
            ChallengeId = auditEvent.ChallengeId,
            Outcome = auditEvent.Outcome,
            Reason = auditEvent.Reason,
            CorrelationId = auditEvent.CorrelationId,
            OccurredAt = auditEvent.OccurredAt,
            SafeMetadata = auditEvent.SafeMetadata
        };
        dbContext.AuthAuditEvents.Add(record);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
