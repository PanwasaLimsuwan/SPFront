var builder = WebApplication.CreateBuilder(args);

// ✅ เพิ่ม CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowVueApp",
        policy => policy.WithOrigins("http://localhost:5173") // เปลี่ยนให้ตรงกับ Vue.js
                        .AllowAnyHeader()
                        .AllowAnyMethod());
});

// ✅ ลงทะเบียน EmployeeService สำหรับ DI
builder.Services.AddSingleton<EmployeeService>();

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ✅ เพิ่ม Controller Services
builder.Services.AddControllers();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ✅ เรียกใช้ CORS ก่อน UseHttpsRedirection
app.UseCors("AllowVueApp");

// ✅ เรียกใช้ UseHttpsRedirection
app.UseHttpsRedirection(); // จะทำงานเฉพาะเมื่อเข้าถึงผ่าน HTTP

// ✅ Map Controller Routes
app.MapControllers(); // เพิ่ม MapControllers เพื่อให้สามารถเข้าถึง API

app.Run();
