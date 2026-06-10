import { Button, Card } from "@heroui/react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">

      {/* NAV */}
      <nav className="flex justify-between items-center px-8 py-4 border-b">
        <h1 className="text-xl font-bold">MyProduct</h1>
        <div className="flex gap-4">
          <Link to="/login">
            <Button variant="light">Login</Button>
          </Link>
          <Link to="/register">
            <Button color="primary">Sign Up</Button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="flex flex-col items-center text-center py-20 px-6">
        <h2 className="text-5xl font-bold mb-6">
          Build faster with HeroUI ⚡
        </h2>
        <p className="text-gray-500 max-w-xl mb-8">
          Clean UI. Fast workflow. Modern stack.
        </p>

        <Link to="/register">
          <Button color="primary" size="lg">
            Get Started
          </Button>
        </Link>
      </section>

      {/* FEATURES */}
      <section className="grid md:grid-cols-3 gap-6 px-8 py-16">
        <Card className="p-6">
          <h3 className="font-semibold">Fast</h3>
          <p className="text-gray-500">Optimized for speed</p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold">Clean</h3>
          <p className="text-gray-500">Minimal modern design</p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold">Flexible</h3>
          <p className="text-gray-500">Tailwind-powered</p>
        </Card>
      </section>

    </div>
  );
}