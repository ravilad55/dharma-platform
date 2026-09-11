using Dharma.Identity.Application;
using Dharma.Identity.Domain;
using Microsoft.EntityFrameworkCore;

namespace Dharma.Infrastructure.Persistence;

public sealed class EfIdentityStore(DharmaDbContext dbContext) : IIdentityStore
{
    public async Task<OtpChallenge?> GetChallengeAsync(Guid challengeId, CancellationToken cancellationToken) =>
        (await dbContext.IdentityOtpChallenges.AsNoTracking().SingleOrDefaultAsync(x => x.Id == challengeId, cancellationToken)) is { } record
            ? ToDomain(record)
            : null;

    public async Task<OtpChallenge?> GetLatestChallengeAsync(string phone, CancellationToken cancellationToken) =>
        (await dbContext.IdentityOtpChallenges.AsNoTracking().Where(x => x.PhoneNormalized == phone).OrderByDescending(x => x.CreatedAt).FirstOrDefaultAsync(cancellationToken)) is { } record
            ? ToDomain(record)
            : null;

    public async Task SaveChallengeAsync(OtpChallenge challenge, CancellationToken cancellationToken)
    {
        var record = await dbContext.IdentityOtpChallenges.SingleOrDefaultAsync(x => x.Id == challenge.Id, cancellationToken);
        if (record is null)
        {
            dbContext.IdentityOtpChallenges.Add(ToRecord(challenge));
        }
        else
        {
            Apply(record, challenge);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<User?> GetUserByPhoneAsync(string phone, CancellationToken cancellationToken) =>
        (await dbContext.IdentityUsers.AsNoTracking().SingleOrDefaultAsync(x => x.PhoneNormalized == phone, cancellationToken)) is { } record
            ? ToDomain(record)
            : null;

    public async Task<User?> GetUserAsync(Guid userId, CancellationToken cancellationToken) =>
        (await dbContext.IdentityUsers.AsNoTracking().SingleOrDefaultAsync(x => x.Id == userId, cancellationToken)) is { } record
            ? ToDomain(record)
            : null;

    public async Task SaveUserAsync(User user, CancellationToken cancellationToken)
    {
        var record = await dbContext.IdentityUsers.SingleOrDefaultAsync(x => x.Id == user.Id, cancellationToken);
        if (record is null)
        {
            dbContext.IdentityUsers.Add(ToRecord(user));
        }
        else
        {
            record.DisplayName = user.DisplayName;
            record.IsActive = user.IsActive;
            record.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveCustomerProfileAsync(CustomerProfile profile, CancellationToken cancellationToken)
    {
        var record = await dbContext.IdentityCustomerProfiles.SingleOrDefaultAsync(x => x.UserId == profile.UserId, cancellationToken);
        if (record is null)
        {
            dbContext.IdentityCustomerProfiles.Add(ToRecord(profile));
        }
        else
        {
            record.Preferences = profile.Preferences;
            record.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<CustomerProfile?> GetCustomerProfileAsync(Guid userId, CancellationToken cancellationToken) =>
        (await dbContext.IdentityCustomerProfiles.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken)) is { } record
            ? ToDomain(record)
            : null;

    public async Task SaveSessionAsync(Session session, CancellationToken cancellationToken)
    {
        var record = await dbContext.IdentitySessions.SingleOrDefaultAsync(x => x.Id == session.Id, cancellationToken);
        if (record is null) dbContext.IdentitySessions.Add(ToRecord(session));
        else Apply(record, session);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Session?> GetSessionAsync(Guid sessionId, CancellationToken cancellationToken) =>
        (await dbContext.IdentitySessions.SingleOrDefaultAsync(x => x.Id == sessionId, cancellationToken)) is { } record
            ? ToDomain(record)
            : null;

    public async Task<IReadOnlyList<Session>> GetSessionsAsync(Guid userId, CancellationToken cancellationToken) =>
        (await dbContext.IdentitySessions.Where(x => x.UserId == userId).ToListAsync(cancellationToken)).Select(ToDomain).ToArray();

    public async Task SaveRefreshTokenAsync(RefreshTokenNode token, CancellationToken cancellationToken)
    {
        var record = await dbContext.IdentityRefreshTokens.SingleOrDefaultAsync(x => x.Id == token.Id, cancellationToken);
        if (record is null) dbContext.IdentityRefreshTokens.Add(ToRecord(token));
        else Apply(record, token);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<RefreshTokenNode?> GetRefreshTokenAsync(string hash, CancellationToken cancellationToken) =>
        (await dbContext.IdentityRefreshTokens.SingleOrDefaultAsync(x => x.TokenHash == hash, cancellationToken)) is { } record
            ? ToDomain(record)
            : null;

    public async Task<IReadOnlyList<RefreshTokenNode>> GetFamilyTokensAsync(Guid familyId, CancellationToken cancellationToken) =>
        (await dbContext.IdentityRefreshTokens.Where(x => x.FamilyId == familyId).ToListAsync(cancellationToken)).Select(ToDomain).ToArray();

    public async Task SaveRoleAsync(Role role, CancellationToken cancellationToken)
    {
        var record = await dbContext.IdentityRoles.SingleOrDefaultAsync(x => x.Id == role.Id, cancellationToken);
        if (record is null)
        {
            dbContext.IdentityRoles.Add(new IdentityRoleRecord { Id = role.Id, Code = role.Code, Description = role.Description });
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<Role?> GetRoleByCodeAsync(string code, CancellationToken cancellationToken) =>
        (await dbContext.IdentityRoles.AsNoTracking().SingleOrDefaultAsync(x => x.Code == code, cancellationToken)) is { } record
            ? new Role(record.Id, record.Code, record.Description)
            : null;

    public async Task SaveUserRoleAsync(UserRole userRole, CancellationToken cancellationToken)
    {
        var exists = await dbContext.IdentityUserRoles.SingleOrDefaultAsync(x => x.UserId == userRole.UserId && x.RoleId == userRole.RoleId, cancellationToken);
        if (exists is null)
        {
            dbContext.IdentityUserRoles.Add(new IdentityUserRoleRecord { UserId = userRole.UserId, RoleId = userRole.RoleId, AssignedAt = userRole.AssignedAt });
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<IReadOnlyList<Role>> GetUserRolesAsync(Guid userId, CancellationToken cancellationToken) =>
        (await dbContext.IdentityUserRoles.AsNoTracking().Where(x => x.UserId == userId).Join(dbContext.IdentityRoles.AsNoTracking(), ur => ur.RoleId, r => r.Id, (ur, r) => r).ToListAsync(cancellationToken))
            .Select(r => new Role(r.Id, r.Code, r.Description)).ToArray();

    public async Task SaveAuthAuditEventAsync(AuthAuditEvent auditEvent, CancellationToken cancellationToken)
    {
        dbContext.AuthAuditEvents.Add(new AuthAuditEventRecord
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
        });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static IdentityUserRecord ToRecord(User user) => new()
    {
        Id = user.Id,
        PhoneNormalized = user.Phone.Normalized,
        PhoneLookupHash = user.Phone.Normalized,
        DisplayName = user.DisplayName,
        IsActive = user.IsActive,
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.CreatedAt,
        CreatedBy = "system",
        UpdatedBy = "system"
    };

    private static User ToDomain(IdentityUserRecord record) => new()
    {
        Id = record.Id,
        Phone = new PhoneNumber(record.PhoneNormalized),
        DisplayName = record.DisplayName,
        IsActive = record.IsActive,
        CreatedAt = record.CreatedAt
    };

    private static IdentityCustomerProfileRecord ToRecord(CustomerProfile profile) => new()
    {
        UserId = profile.UserId,
        Preferences = profile.Preferences,
        CreatedAt = profile.CreatedAt,
        UpdatedAt = profile.UpdatedAt
    };

    private static CustomerProfile ToDomain(IdentityCustomerProfileRecord record) => new()
    {
        UserId = record.UserId,
        Preferences = record.Preferences,
        CreatedAt = record.CreatedAt,
        UpdatedAt = record.UpdatedAt
    };

    private static IdentityOtpChallengeRecord ToRecord(OtpChallenge challenge) => new()
    {
        Id = challenge.Id,
        PhoneNormalized = challenge.Phone.Normalized,
        CodeHash = challenge.CodeHash,
        State = challenge.State,
        AttemptCount = challenge.AttemptCount,
        ExpiresAt = challenge.ExpiresAt,
        ResendAvailableAt = challenge.ResendAvailableAt,
        ConsumedAt = challenge.ConsumedAt,
        CreatedAt = challenge.CreatedAt
    };

    private static OtpChallenge ToDomain(IdentityOtpChallengeRecord record)
    {
        var challenge = new OtpChallenge
        {
            Id = record.Id,
            Phone = new PhoneNumber(record.PhoneNormalized),
            CodeHash = record.CodeHash,
            ExpiresAt = record.ExpiresAt,
            ResendAvailableAt = record.ResendAvailableAt,
            CreatedAt = record.CreatedAt
        };
        challenge.Restore(record.State, record.AttemptCount, record.ConsumedAt);
        return challenge;
    }

    private static IdentitySessionRecord ToRecord(Session session) => new()
    {
        Id = session.Id,
        UserId = session.UserId,
        FamilyId = session.FamilyId,
        State = session.State,
        CreatedAt = session.CreatedAt,
        LastSeenAt = session.LastSeenAt,
        ExpiresAt = session.ExpiresAt
    };

    private static Session ToDomain(IdentitySessionRecord record)
    {
        var session = new Session
        {
            Id = record.Id,
            UserId = record.UserId,
            FamilyId = record.FamilyId,
            CreatedAt = record.CreatedAt,
            ExpiresAt = record.ExpiresAt
        };
        session.Restore(record.State, record.LastSeenAt);
        return session;
    }

    private static IdentityRefreshTokenRecord ToRecord(RefreshTokenNode token) => new()
    {
        Id = token.Id,
        SessionId = token.SessionId,
        FamilyId = token.FamilyId,
        TokenHash = token.TokenHash,
        ExpiresAt = token.ExpiresAt,
        ConsumedAt = token.ConsumedAt,
        RevokedAt = token.RevokedAt
    };

    private static RefreshTokenNode ToDomain(IdentityRefreshTokenRecord record)
    {
        var token = new RefreshTokenNode
        {
            Id = record.Id,
            SessionId = record.SessionId,
            FamilyId = record.FamilyId,
            TokenHash = record.TokenHash,
            ExpiresAt = record.ExpiresAt
        };
        token.Restore(record.ConsumedAt, record.RevokedAt);
        return token;
    }

    private static void Apply(IdentityOtpChallengeRecord record, OtpChallenge challenge)
    {
        record.State = challenge.State;
        record.AttemptCount = challenge.AttemptCount;
        record.ConsumedAt = challenge.ConsumedAt;
    }

    private static void Apply(IdentitySessionRecord record, Session session)
    {
        record.State = session.State;
        record.LastSeenAt = session.LastSeenAt;
    }

    private static void Apply(IdentityRefreshTokenRecord record, RefreshTokenNode token)
    {
        record.ConsumedAt = token.ConsumedAt;
        record.RevokedAt = token.RevokedAt;
    }
}
