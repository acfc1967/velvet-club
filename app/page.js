import Link from "next/link";

export default function Home() {
  return (
    <main className="velvetHome">

      <section className="hero">

        <div className="heroGlow" />

        <p className="eyebrow">
          ✦ THE NEXT GENERATION COMMUNITY HUB
        </p>


        <h1>
          Welcome to
          <span>
            Velvet
          </span>
        </h1>


        <p className="description">
          A premium Discord experience built around
          communities, achievements, progression,
          and connection.
        </p>


        <div className="buttons">

          <Link
            href="/dashboard"
            className="primaryButton"
          >
            Enter Velvet
          </Link>


          <a
            href="#features"
            className="secondaryButton"
          >
            Explore
          </a>

        </div>


      </section>



      <section
        id="features"
        className="features"
      >


        <div className="featureCard">

          <span>
            🏆
          </span>

          <h3>
            Achievements
          </h3>

          <p>
            Unlock rewards, titles,
            and milestones as you grow.
          </p>

        </div>



        <div className="featureCard">

          <span>
            ✨
          </span>

          <h3>
            Progression
          </h3>

          <p>
            Level up your Velvet profile
            and showcase your journey.
          </p>

        </div>



        <div className="featureCard">

          <span>
            🌙
          </span>

          <h3>
            Community
          </h3>

          <p>
            Connect, share interests,
            and build friendships.
          </p>

        </div>


      </section>



      <footer>

        © {new Date().getFullYear()} Velvet Club

      </footer>


    </main>
  );
}
