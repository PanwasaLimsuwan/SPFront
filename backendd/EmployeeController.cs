using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

namespace YourProjectNamespace.Controllers
{
   [Route("api/[controller]")]  // กำหนดเส้นทางหลักสำหรับ Controller นี้
   [ApiController]
   public class EmployeeController : ControllerBase
   {
       private readonly EmployeeService _employeeService;

       public EmployeeController(EmployeeService employeeService)
       {
           _employeeService = employeeService;
       }

       // ใช้สำหรับทดสอบการเชื่อมต่อฐานข้อมูล
       [HttpGet("connect")]
       public IActionResult TestDatabaseConnection()
       {
           try
           {
               _employeeService.ConnectToDatabase();
               return Ok("Connected to the database successfully!");
           }
           catch (Exception ex)
           {
               return StatusCode(500, $"Error connecting to database: {ex.Message}");
           }
       }

       // เพิ่มการดึงข้อมูลพนักงานทั้งหมดจากฐานข้อมูล
       [HttpGet("all")]  // เพิ่ม Route สำหรับดึงข้อมูลพนักงานทั้งหมด
       public IActionResult GetEmployees()
       {
           try
           {
               var employees = _employeeService.GetAllEmployees();
               return Ok(employees); // ส่งข้อมูลพนักงานไปยังผู้ร้องขอ
           }
           catch (Exception ex)
           {
               return StatusCode(500, $"Error retrieving data: {ex.Message}");
           }
       }
   }
}
