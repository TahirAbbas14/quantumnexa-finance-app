console.log("Testing database connection and data availability...");

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://tjlbkajdasjsyqxmgkst.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqbGJrYWpkYXNqc3lxeG1na3N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjY1OTMsImV4cCI6MjA3Mzk0MjU5M30.ZPv6WtJRWGyV4XwhOSJGkhaL3wFxKMBdMT2hvphr7ao";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  try {
    console.log("1. Testing connection...");
    
    // Test basic connection
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log("Auth session:", authData?.session ? "Active" : "No session");
    
    // Check if tables exist by querying them
    console.log("\\n2. Checking tables...");
    
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .limit(5);
    
    console.log("Clients table:", clientsError ? `Error: ${clientsError.message}` : `Found ${clients?.length || 0} clients`);
    if (clients && clients.length > 0) {
      console.log("Sample client:", clients[0]);
    }
    
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .limit(5);
    
    console.log("Projects table:", projectsError ? `Error: ${projectsError.message}` : `Found ${projects?.length || 0} projects`);
    if (projects && projects.length > 0) {
      console.log("Sample project:", projects[0]);
    }
    
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("*")
      .limit(5);
    
    console.log("Invoices table:", invoicesError ? `Error: ${invoicesError.message}` : `Found ${invoices?.length || 0} invoices`);
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testDatabase();
