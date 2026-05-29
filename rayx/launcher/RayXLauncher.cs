using System;
using System.Diagnostics;
using System.IO;
using System.Linq;

public static class RayXLauncher
{
    public static int Main(string[] args)
    {
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string repoRoot = Path.GetFullPath(Path.Combine(baseDir, "..", ".."));
        string script = Path.Combine(repoRoot, "rayx", "bin", "rayx.js");

        if (!File.Exists(script))
        {
            repoRoot = baseDir;
            script = Path.Combine(repoRoot, "rayx", "bin", "rayx.js");
        }

        if (!File.Exists(script))
        {
            Console.Error.WriteLine("RayX nao encontrou rayx/bin/rayx.js.");
            Console.Error.WriteLine("Execute o RayX.exe dentro do repositorio ou em dist/rayx.");
            return 1;
        }

        string node = FindNode();
        if (string.IsNullOrWhiteSpace(node) || !File.Exists(node))
        {
            Console.Error.WriteLine("Node.js nao encontrado. Instale Node.js ou adicione node.exe ao PATH.");
            return 1;
        }

        string[] forwarded = args.Length == 0 ? new[] { "desktop" } : args;
        string arguments = Quote(script) + " " + string.Join(" ", forwarded.Select(Quote));

        var start = new ProcessStartInfo
        {
            FileName = node,
            Arguments = arguments,
            WorkingDirectory = repoRoot,
            UseShellExecute = false
        };

        using (var process = Process.Start(start))
        {
            process.WaitForExit();
            return process.ExitCode;
        }
    }

    private static string FindNode()
    {
        string pathNode = FindOnPath("node.exe");
        if (!string.IsNullOrWhiteSpace(pathNode)) return pathNode;

        string programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string node = Path.Combine(programFiles, "nodejs", "node.exe");
        if (File.Exists(node)) return node;

        string x86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        node = Path.Combine(x86, "nodejs", "node.exe");
        if (File.Exists(node)) return node;

        return null;
    }

    private static string FindOnPath(string fileName)
    {
        string path = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (string part in path.Split(Path.PathSeparator))
        {
            if (string.IsNullOrWhiteSpace(part)) continue;
            string candidate = Path.Combine(part.Trim(), fileName);
            if (File.Exists(candidate)) return candidate;
        }

        return null;
    }

    private static string Quote(string value)
    {
        if (value == null) return "\"\"";
        return "\"" + value.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"";
    }
}
