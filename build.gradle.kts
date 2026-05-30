import org.asciidoctor.gradle.jvm.pdf.AsciidoctorPdfTask

plugins {
    id("org.asciidoctor.jvm.pdf") version "4.0.4"
}

repositories {
    mavenCentral()
}

asciidoctorj {
    // Rendert [mermaid]-Blöcke beim Build via lokalem mmdc (offline, kein Netzwerk)
    modules {
        diagram.use()
    }
}

// Erzeugt build/docs/asciidocPdf/konzept.pdf
tasks.named<AsciidoctorPdfTask>("asciidoctorPdf") {
    group = "documentation"
    description = "Erzeugt das Konzept-PDF aus docs/konzept.adoc (inkl. Mermaid-Diagramme)."

    baseDirFollowsSourceFile()
    setSourceDir(file("docs"))
    sources {
        include("konzept.adoc")
    }

    // mmdc/Chromium braucht auf Linux i. d. R. --no-sandbox
    attributes(
        mapOf(
            "mermaid-puppeteer-config" to file("docs/.puppeteer-config.json").absolutePath,
            "mermaid-format" to "png",
        ),
    )
}
