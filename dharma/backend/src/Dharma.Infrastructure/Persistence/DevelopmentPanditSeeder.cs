using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Dharma.Infrastructure.Persistence;

/// <summary>
/// Development-only seed data for Pandit discovery. Clearly separated from production data: it is
/// invoked from Program.cs only in the Development environment and is a no-op once any pandit exists.
/// Image references point at bundled mobile artwork ("pandits/*.png"), never external URLs.
/// </summary>
public static class DevelopmentPanditSeeder
{
    public static async Task SeedDevelopmentPanditsAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        if (await dbContext.Pandits.AnyAsync(cancellationToken)) return;

        var now = DateTimeOffset.UtcNow;

        // 8 pandits: varied cities, experience, languages, ratings, prices, availability.
        var sharma = Pandit("11111111-0000-4000-a000-000000000001", "Pandit Ramesh Sharma", "pandits/pandit-ramesh.png", "Vedic scholar specialising in home and prosperity ceremonies.", 18, "Thane", "Maharashtra", ["Marathi", "Hindi", "Sanskrit"], 4.8m, 214, true, now);
        var iyer = Pandit("11111111-0000-4000-a000-000000000002", "Pandit Krishna Iyer", "pandits/pandit-krishna.png", "South Indian rituals and Navagraha shanti expert.", 22, "Bengaluru", "Karnataka", ["Tamil", "Kannada", "Sanskrit"], 4.9m, 340, true, now);
        var mishra = Pandit("11111111-0000-4000-a000-000000000003", "Pandit Anil Mishra", "pandits/pandit-anil.png", "Performs traditional Havan and Rudrabhishek ceremonies.", 12, "Varanasi", "Uttar Pradesh", ["Hindi", "Sanskrit", "Bhojpuri"], 4.7m, 156, true, now);
        var joshi = Pandit("11111111-0000-4000-a000-000000000004", "Pandit Mahesh Joshi", "pandits/pandit-mahesh.png", "Wedding and Griha Pravesh specialist for over a decade.", 15, "Pune", "Maharashtra", ["Marathi", "Hindi"], 4.6m, 98, true, now);
        var trivedi = Pandit("11111111-0000-4000-a000-000000000005", "Pandit Suresh Trivedi", "pandits/pandit-suresh.png", "Ganesh and Lakshmi puja for festivals and new beginnings.", 9, "Ahmedabad", "Gujarat", ["Gujarati", "Hindi", "Sanskrit"], 4.5m, 72, true, now);
        var nair = Pandit("11111111-0000-4000-a000-000000000006", "Pandit Vishnu Nair", "pandits/pandit-vishnu.png", "Satyanarayan katha and Navgraha remedies.", 20, "Kochi", "Kerala", ["Malayalam", "Tamil", "Sanskrit"], 4.8m, 188, false, now);
        var dubey = Pandit("11111111-0000-4000-a000-000000000007", "Pandit Gopal Dubey", "pandits/pandit-gopal.png", "Astrology-guided pujas and shanti ceremonies.", 7, "Thane", "Maharashtra", ["Hindi", "Marathi", "Sanskrit"], 4.3m, 41, true, now);
        var rao = Pandit("11111111-0000-4000-a000-000000000008", "Pandit Venkatesh Rao", "pandits/pandit-venkatesh.png", "Housewarming and prosperity rituals across Telugu traditions.", 25, "Hyderabad", "Telangana", ["Telugu", "Sanskrit", "Hindi"], 5.0m, 402, true, now);

        dbContext.Pandits.AddRange(sharma, iyer, mishra, joshi, trivedi, nair, dubey, rao);

        dbContext.PanditServices.AddRange(
            // Ramesh Sharma
            Service(sharma.Id, "Satyanarayan Puja", "Complete Satyanarayan Puja ceremony with katha and prasad.", 120, 999m, true, now),
            Service(sharma.Id, "Griha Pravesh", "Traditional housewarming ceremony for a new home.", 180, 2100m, true, now),
            Service(sharma.Id, "Lakshmi Puja", "Prosperity puja for home and business.", 90, 1100m, true, now),
            // Krishna Iyer
            Service(iyer.Id, "Navgraha Puja", "Nine-planet shanti puja to balance planetary influences.", 150, 2500m, true, now),
            Service(iyer.Id, "Rudrabhishek", "Sacred abhishekam of Lord Shiva.", 120, 1800m, true, now),
            Service(iyer.Id, "Ganesh Puja", "Auspicious Ganesh puja for new beginnings.", 60, 851m, true, now),
            // Anil Mishra
            Service(mishra.Id, "Havan", "Sacred fire ritual for purification and blessings.", 120, 1500m, true, now),
            Service(mishra.Id, "Rudrabhishek", "Rudrabhishek with Vedic chanting.", 150, 2100m, true, now),
            Service(mishra.Id, "Ganesh Puja", "Ganesh puja for auspicious occasions.", 60, 799m, true, now),
            // Mahesh Joshi
            Service(joshi.Id, "Wedding Puja", "Complete traditional Hindu wedding ceremony.", 300, 11000m, true, now),
            Service(joshi.Id, "Griha Pravesh", "Housewarming puja with vastu shanti.", 180, 2400m, true, now),
            // legacy/retired offering kept inactive to prove active-only filtering
            Service(joshi.Id, "Legacy Engagement Ritual", "Discontinued package retained for history.", 90, 3000m, false, now),
            // Suresh Trivedi
            Service(trivedi.Id, "Ganesh Puja", "Festival Ganesh puja with aarti.", 75, 900m, true, now),
            Service(trivedi.Id, "Lakshmi Puja", "Diwali Lakshmi puja for wealth and prosperity.", 90, 1250m, true, now),
            // Vishnu Nair (currently unavailable pandit, still discoverable)
            Service(nair.Id, "Satyanarayan Puja", "Satyanarayan katha with full vidhi.", 120, 1050m, true, now),
            Service(nair.Id, "Navgraha Puja", "Navagraha shanti for planetary remedies.", 150, 2300m, true, now),
            // Gopal Dubey
            Service(dubey.Id, "Navgraha Puja", "Astrology-guided Navagraha puja.", 120, 1600m, true, now),
            Service(dubey.Id, "Havan", "Purification havan for peace and health.", 90, 1200m, true, now),
            // Venkatesh Rao
            Service(rao.Id, "Griha Pravesh", "Telugu-tradition housewarming ceremony.", 180, 2600m, true, now),
            Service(rao.Id, "Satyanarayan Puja", "Satyanarayan vratam with prasadam.", 120, 1150m, true, now),
            Service(rao.Id, "Wedding Puja", "Traditional Telugu wedding rituals.", 300, 13000m, true, now));

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static PanditRecord Pandit(string id, string displayName, string imageUrl, string shortDescription, int experienceYears, string city, string state, List<string> languages, decimal rating, int reviewCount, bool isAvailable, DateTimeOffset now) => new()
    {
        Id = Guid.Parse(id),
        DisplayName = displayName,
        ImageUrl = imageUrl,
        ShortDescription = shortDescription,
        ExperienceYears = experienceYears,
        City = city,
        State = state,
        Languages = languages,
        Rating = rating,
        ReviewCount = reviewCount,
        IsAvailable = isAvailable,
        IsActive = true,
        CreatedAtUtc = now,
        UpdatedAtUtc = now
    };

    private static PanditServiceRecord Service(Guid panditId, string name, string description, int durationMinutes, decimal price, bool isActive, DateTimeOffset now) => new()
    {
        Id = Guid.NewGuid(),
        PanditId = panditId,
        Name = name,
        Description = description,
        DurationMinutes = durationMinutes,
        Price = price,
        Currency = "INR",
        IsActive = isActive,
        CreatedAtUtc = now,
        UpdatedAtUtc = now
    };
}
