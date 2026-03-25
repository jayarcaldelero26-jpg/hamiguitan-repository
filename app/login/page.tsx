import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "@/app/login/LoginForm";
import { getCurrentUser } from "@/app/lib/auth";
import styles from "./login.module.css";

const LOGIN_BACKGROUND_SRC = "/images/auth/hamiguitan-login-bg.optimized.webp";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className={styles.wrap}>
      <div className={styles.bgMedia} aria-hidden="true">
        <Image
          src={LOGIN_BACKGROUND_SRC}
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.bgImage}
        />
      </div>
      <div className={styles.bgOverlay} />
      <div className={`${styles.bgGlow} ${styles.bgGlow1}`} />
      <div className={`${styles.bgGlow} ${styles.bgGlow2}`} />

      <section className={`${styles.card} ${styles.cardEnter}`}>
        <div className={styles.topBar}>
          <Link href="/" className={styles.backHome}>
            {"<-"} Back to Home
          </Link>
        </div>

        <div className={styles.logoRow}>
          <div className={styles.logoItemSmall}>
            <Image
              src="/images/branding/denr-logo.png"
              alt="DENR Logo"
              width={92}
              height={92}
              className={styles.logoSmall}
            />
          </div>

          <div className={styles.logoItemSmall}>
            <Image
              src="/images/branding/asean-logo.png"
              alt="ASEAN Logo"
              width={92}
              height={92}
              className={styles.logoSmall}
            />
          </div>

          <div className={styles.logoItemCenter}>
            <Image
              src="/images/branding/mhrws-logo.png"
              alt="MHRWS Logo"
              width={126}
              height={126}
              className={styles.logoCenter}
            />
          </div>

          <div className={styles.logoItemSmall}>
            <Image
              src="/images/branding/unesco-logo.png"
              alt="UNESCO Logo"
              width={92}
              height={92}
              className={styles.logoSmall}
            />
          </div>
        </div>

        <Link href="/" className={styles.brandLink}>
          <div className={styles.brandBlock}>
            <h2 className={styles.brandSubTitle}>Protected Area Management Office</h2>

            <h1 className={styles.brandMain}>Mt. Hamiguitan Range Wildlife Sanctuary</h1>
          </div>
        </Link>

        <LoginForm />
      </section>
    </main>
  );
}
