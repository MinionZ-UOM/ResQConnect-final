import com.android.build.gradle.LibraryExtension

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}

subprojects {
    afterEvaluate {
        if (name == "shared_storage") {
            val androidExtension = extensions.findByName("android") as? LibraryExtension
            if (androidExtension != null && androidExtension.namespace.isNullOrEmpty()) {
                val manifest = file("src/main/AndroidManifest.xml")
                val manifestPackage = if (manifest.exists()) {
                    val content = manifest.readText()
                    val match = Regex("package=\"([^\"]+)\"").find(content)
                    match?.groupValues?.getOrNull(1)
                } else {
                    null
                }
                androidExtension.namespace = manifestPackage ?: "dev.fluttercommunity.plus.sharedstorage"
            }
        }
    }
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
