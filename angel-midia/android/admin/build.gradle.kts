plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }

android {
    namespace = "br.com.angelmidia.admin"
    compileSdk = 35
    defaultConfig {
        applicationId = "br.com.angelmidia.admin"
        minSdk = 26
        targetSdk = 35
        versionCode = providers.gradleProperty("angelVersionCode").get().toInt()
        versionName = providers.gradleProperty("angelVersionName").get()
        buildConfigField("String", "BASE_URL", "\"${providers.gradleProperty("angelBaseUrl").get()}\"")
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    buildFeatures { buildConfig = true }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
    val releaseStore = System.getenv("ANGEL_KEYSTORE_PATH")
    val releasePassword = System.getenv("ANGEL_KEYSTORE_PASSWORD")
    if (releaseStore != null && releasePassword != null) signingConfigs.create("release") {
        storeFile = file(releaseStore); storePassword = releasePassword; keyAlias = "angel-midia-play"; keyPassword = releasePassword
    }
    buildTypes { release { isMinifyEnabled = false; signingConfig = signingConfigs.findByName("release") } }
}

dependencies { testImplementation("junit:junit:4.13.2") }
