using System.Collections.Concurrent;
using Dharma.Identity.Application;
using Dharma.Identity.Domain;

namespace Dharma.Identity.Infrastructure;

public sealed class InMemoryIdentityStore : IIdentityStore
{
    private readonly ConcurrentDictionary<Guid, User> users = new();
    private readonly ConcurrentDictionary<Guid, OtpChallenge> challenges = new();
    private readonly ConcurrentDictionary<Guid, Session> sessions = new();
    private readonly ConcurrentDictionary<string, RefreshTokenNode> tokens = new(StringComparer.Ordinal);

    public Task<OtpChallenge?> GetChallengeAsync(Guid challengeId, CancellationToken cancellationToken) => Task.FromResult(challenges.GetValueOrDefault(challengeId));
    public Task<OtpChallenge?> GetLatestChallengeAsync(string phone, CancellationToken cancellationToken) => Task.FromResult(challenges.Values.Where(x => x.Phone.Normalized == phone).OrderByDescending(x => x.CreatedAt).FirstOrDefault());
    public Task SaveChallengeAsync(OtpChallenge challenge, CancellationToken cancellationToken) { challenges[challenge.Id] = challenge; return Task.CompletedTask; }
    public Task<User?> GetUserByPhoneAsync(string phone, CancellationToken cancellationToken) => Task.FromResult(users.Values.FirstOrDefault(x => x.Phone.Normalized == phone));
    public Task<User?> GetUserAsync(Guid userId, CancellationToken cancellationToken) => Task.FromResult(users.GetValueOrDefault(userId));
    public Task SaveUserAsync(User user, CancellationToken cancellationToken) { users[user.Id] = user; return Task.CompletedTask; }
    public Task SaveSessionAsync(Session session, CancellationToken cancellationToken) { sessions[session.Id] = session; return Task.CompletedTask; }
    public Task<Session?> GetSessionAsync(Guid sessionId, CancellationToken cancellationToken) => Task.FromResult(sessions.GetValueOrDefault(sessionId));
    public Task<IReadOnlyList<Session>> GetSessionsAsync(Guid userId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Session>>(sessions.Values.Where(x => x.UserId == userId).ToArray());
    public Task SaveRefreshTokenAsync(RefreshTokenNode token, CancellationToken cancellationToken) { tokens[token.TokenHash] = token; return Task.CompletedTask; }
    public Task<RefreshTokenNode?> GetRefreshTokenAsync(string hash, CancellationToken cancellationToken) => Task.FromResult(tokens.GetValueOrDefault(hash));
    public Task<IReadOnlyList<RefreshTokenNode>> GetFamilyTokensAsync(Guid familyId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<RefreshTokenNode>>(tokens.Values.Where(x => x.FamilyId == familyId).ToArray());
}
