import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import RestaurantCard from "@/components/RestaurantCard";
import { Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Favourites() {
  const { user } = useAuth();
  const [data, setData] = useState({ restaurants: [], products: [] });
  useEffect(() => { if (user) api.get("/me/favourites").then(({ data }) => setData(data)); }, [user]);

  if (!user) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <Heart size={40} className="mx-auto text-[#4A0E2E]" />
      <h2 className="mt-4 font-display font-black text-2xl text-[#4A0E2E]">Save your favourites</h2>
      <p className="text-slate-500 text-sm mt-1">Login to keep track of the food you love.</p>
      <Link to="/login" className="mt-6 inline-block bg-[#4A0E2E] text-white font-bold text-sm px-6 py-3 rounded-full">Login</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display font-black text-3xl text-[#4A0E2E]">My Favourites</h1>
      <div className="mt-5">
        {data.restaurants.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.restaurants.map(r => <RestaurantCard key={r.id} r={r} />)}
          </div>
        ) : <div className="text-center py-12 text-slate-500">No favourites yet — tap the heart on any restaurant.</div>}
      </div>
    </div>
  );
}
