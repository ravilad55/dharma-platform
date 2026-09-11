using System.Collections.Concurrent;
using Dharma.Identity.Application;
using Dharma.Identity.Domain;

namespace Dharma.Identity.Infrastructure;

public sealed class InMemoryIdentityStore : IIdentityStore
{
    private readonly ConcurrentDictionary<Guid, User> users = new();
    private readonly ConcurrentDictionary<Guid, CustomerProfile> profiles = new();
    private readonly ConcurrentDictionary<Guid, OtpChallenge> challenges = new();
    private readonly ConcurrentDictionary<Guid, Session> sessions = new();
    private readonly ConcurrentDictionary<string, RefreshTokenNode> tokens = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<string, Role> roles = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<(Guid, Guid), UserRole> userRoles = new();
    private readonly ConcurrentDictionary<Guid, AuthAuditEvent> auditEvents = new();

    public Task<OtpChallenge?> GetChallengeAsync(Guid challengeId, CancellationToken cancellationToken) => Task.FromResult(challenges.GetValueOrDefault(challengeId));
    public Task<OtpChallenge?> GetLatestChallengeAsync(string phone, CancellationToken cancellationToken) => Task.FromResult(challenges.Values.Where(x => x.Phone.Normalized == phone).OrderByDescending(x => x.CreatedAt).FirstOrDefault());
    public Task SaveChallengeAsync(OtpChallenge challenge, CancellationToken cancellationToken) { challenges[challenge.Id] = challenge; return Task.CompletedTask; }
    public Task<User?> GetUserByPhoneAsync(string phone, CancellationToken cancellationToken) => Task.FromResult(users.Values.FirstOrDefault(x => x.Phone.Normalized == phone));
    public Task<User?> GetUserAsync(Guid userId, CancellationToken cancellationToken) => Task.FromResult(users.GetValueOrDefault(userId));
    public Task SaveUserAsync(User user, CancellationToken cancellationToken) { users[user.Id] = user; return Task.CompletedTask; }
    public Task SaveCustomerProfileAsync(CustomerProfile profile, CancellationToken cancellationToken) { profiles[profile.UserId] = profile; return Task.CompletedTask; }
    public Task<CustomerProfile?> GetCustomerProfileAsync(Guid userId, CancellationToken cancellationToken) => Task.FromResult(profiles.GetValueOrDefault(userId));
    public Task SaveSessionAsync(Session session, CancellationToken cancellationToken) { sessions[session.Id] = session; return Task.CompletedTask; }
    public Task<Session?> GetSessionAsync(Guid sessionId, CancellationToken cancellationToken) => Task.FromResult(sessions.GetValueOrDefault(sessionId));
    public Task<IReadOnlyList<Session>> GetSessionsAsync(Guid userId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Session>>(sessions.Values.Where(x => x.UserId == userId).ToArray());
    public Task SaveRefreshTokenAsync(RefreshTokenNode token, CancellationToken cancellationToken) { tokens[token.TokenHash] = token; return Task.CompletedTask; }
    public Task<RefreshTokenNode?> GetRefreshTokenAsync(string hash, CancellationToken cancellationToken) => Task.FromResult(tokens.GetValueOrDefault(hash));
    public Task<IReadOnlyList<RefreshTokenNode>> GetFamilyTokensAsync(Guid familyId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<RefreshTokenNode>>(tokens.Values.Where(x => x.FamilyId == familyId).ToArray());
    public Task SaveRoleAsync(Role role, CancellationToken cancellationToken) { roles[role.Code] = role; return Task.CompletedTask; }
    public Task<Role?> GetRoleByCodeAsync(string code, CancellationToken cancellationToken) => Task.FromResult(roles.GetValueOrDefault(code));
    public Task SaveUserRoleAsync(UserRole userRole, CancellationToken cancellationToken) { userRoles[(userRole.UserId, userRole.RoleId)] = userRole; return Task.CompletedTask; }
    public Task<IReadOnlyList<Role>> GetUserRolesAsync(Guid userId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Role>>(userRoles.Values.Where(x => x.UserId == userId).Select(x => roles.Values.First(r => r.Id == x.RoleId)).ToArray());
    public Task SaveAuthAuditEventAsync(AuthAuditEvent auditEvent, CancellationToken cancellationToken) { auditEvents[auditEvent.Id] = auditEvent; return Task.CompletedTask; }
}
