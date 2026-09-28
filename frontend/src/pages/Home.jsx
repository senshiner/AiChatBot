import Header from "../components/Header";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
const Home = () => {
  return (
    <>
      <Header />
      <main className="flex-grow">
        <Hero />
        <Footer />
      </main>
    </>
  );
};

export default Home;
