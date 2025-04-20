"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";


export const Hero = () => {

    const imageRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const imageElement = imageRef.current;

        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            const scrollThreshold = 100;

            if (scrollPosition > scrollThreshold) {
                imageElement?.classList.add("scrolled");
            } else {
                imageElement?.classList.remove("scrolled");
            }
        }

        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
    }, [imageRef]);

    return (
        <div className="pb-20 px-4">
            <div className="container mx-auto text-center">
                <h1 className="text-5xl md:text-8xl lg:text-[105px] pb-6 gradient-title">
                    Manage your Finances <br /> with Intelligence
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">A AI-powered financial management platform that helps you track, analyze, and optimize your spendings with real-time inights.</p>
                <div className="flex justify-center space-x-4">
                    <Link href="/dashboard">
                        <Button size="lg" className="px-10">
                            Get Started
                            <ArrowRightIcon className="size-4" />
                        </Button>
                    </Link>
                    {/* <Link href="/">
                        <Button size="lg" variant="outline" className="px-8">Watch Demo</Button>
                    </Link> */}
                </div>
                <div className="hero-image-wrapper">
                    <div ref={imageRef} className="hero-image">
                        <Image 
                            src="/banner.jpeg"
                            alt="banner"
                            width={1280}
                            height={720}
                            className="rounded-lg shadow-2xl border mx-auto"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}