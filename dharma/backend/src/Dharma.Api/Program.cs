using Dharma.Api.Endpoints;
using Dharma.Api.Middleware;
using Dharma.Infrastructure;
using Dharma.Identity.Application;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);

if (string.IsNullOrWhiteSpace(builder.Configuration["Authentication:SigningKey"]))
{
    if (builder.Environment.IsProduction())
        throw new InvalidOperationException("Authentication:SigningKey must be configured in production.");

    builder.Configuration["Authentication:SigningKey"] = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
}

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ProblemDetailsExceptionHandler>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Dharma API",
        Version = "v1",
        Description = "Dharma Spiritual-Services Platform API"
    });

    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below. Example: \"Bearer 12345abcdef\""
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
var authPolicy = builder.Configuration.GetSection("Authentication").Get<AuthPolicyOptions>() ?? new AuthPolicyOptions();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = authPolicy.Issuer,
        ValidateAudience = true,
        ValidAudience = authPolicy.Audience,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authPolicy.SigningKey)),
        NameClaimType = System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub,
        RoleClaimType = System.Security.Claims.ClaimTypes.Role
    };
});
builder.Services.AddAuthorization();
builder.Services.AddHealthChecks();
builder.Services.AddDharmaInfrastructure(builder.Configuration, builder.Environment);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Dharma API v1");
        options.RoutePrefix = "swagger";
    });
}

app.UseExceptionHandler();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.UseStatusCodePages(async statusCodeContext =>
{
    var response = statusCodeContext.HttpContext.Response;
    var request = statusCodeContext.HttpContext.Request;
    if (response.StatusCode == StatusCodes.Status404NotFound && request.Path.StartsWithSegments("/api"))
    {
        await Results.Problem(
            statusCode: StatusCodes.Status404NotFound,
            title: "Resource not found",
            type: "https://api.dharma.local/problems/not-found",
            instance: request.Path,
            extensions: new Dictionary<string, object?> { ["correlationId"] = request.HttpContext.TraceIdentifier })
            .ExecuteAsync(request.HttpContext);
    }
});

app.MapControllers();
app.MapFoundationEndpoints();

app.Run();

public partial class Program;
