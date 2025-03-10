using Microsoft.Data.SqlClient;
using System;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic; // เพิ่มการใช้ List

public class EmployeeService
{
    private readonly string _connectionString;

    // Constructor to initialize connection string
    public EmployeeService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("ManpowerDbConnection") 
            ?? throw new ArgumentNullException("ManpowerDbConnection", "Connection string is missing.");
    }

    // Method to connect to the database and fetch data
    public void ConnectToDatabase()
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            connection.Open();
            Console.WriteLine("Connected to the database successfully.");
        }
    }

    // Method to get all employees from the database
    public List<Employee> GetAllEmployees()
    {
        List<Employee> employees = new List<Employee>();

        string query = "SELECT * FROM dbo.EmployeeInfo";  // ตัวอย่าง query

        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            SqlCommand command = new SqlCommand(query, connection);
            connection.Open();

            SqlDataReader reader = command.ExecuteReader();
            while (reader.Read())
            {
                Employee employee = new Employee
                {
                    EmpID = reader["EmpID"].ToString(),
                    FirstName = reader["FirstName"].ToString(),
                    LastName = reader["LastName"].ToString(),
                    Division = reader["Division"].ToString(),
                    Department = reader["Department"].ToString(),
                    Biz = reader["Biz"].ToString(),
                    Process = reader["Process"].ToString(),
                };

                employees.Add(employee);
            }
        }
        return employees;
    }
}
