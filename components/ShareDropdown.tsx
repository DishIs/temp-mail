// components/ShareDropdown.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/toast";
import { FaTwitter, FaFacebook, FaLinkedin, FaReddit, FaWhatsapp, FaTelegramPlane, FaEnvelope } from "react-icons/fa";
import Image from "next/image";

const shareUrl = "https://www.freecustom.email/en";
const shareText = "Create your free temporary email address today! Check out FreeCustom.Email";

const sharePlatforms =[
  {
    name: "Twitter",
    Icon: FaTwitter,
    createUrl: (url: string, text: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    name: "Facebook",
    Icon: FaFacebook,
    createUrl: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "LinkedIn",
    Icon: FaLinkedin,
    createUrl: (url: string, text: string) => `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  },
  {
    name: "Reddit",
    Icon: FaReddit,
    createUrl: (url: string, text: string) => `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  },
  {
    name: "WhatsApp",
    Icon: FaWhatsapp,
    createUrl: (url: string, text: string) => `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`,
  },
  {
    name: "Telegram",
    Icon: FaTelegramPlane,
    createUrl: (url: string, text: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    name: "Email",
    Icon: FaEnvelope,
    createUrl: (url: string, text: string) => `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent("Check this out: " + url)}`,
  },
];

const reviewPlatforms =[
  { name: "Product Hunt", href: "https://www.producthunt.com/products/fce/reviews/new", logo: "/product-hunt.svg" },
  { name: "Trustpilot", href: "https://www.trustpilot.com/review/freecustom.email", logo: "/trustpilot.svg" },
  { name: "G2", href: "https://www.g2.com/products/freecustom-email/reviews", logo: "/g2.svg" },
  { name: "AlternativeTo", href: "https://alternativeto.net/software/freecustom-email/about", logo: "/alternative-to.svg" },
];

export function ShareDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={() => setIsOpen(!isOpen)}
        title="Share this page" 
        aria-label="Share this page"
        aria-expanded={isOpen}
      >
        <Share className="h-4 w-4" />
      </Button>

      <div
        className={`absolute right-0 top-full mt-2 w-64 origin-top-right rounded-lg border border-border bg-background p-1.5 shadow-xl transition-all duration-200 z-50 ${
          isOpen ? "scale-100 opacity-100 visible" : "scale-95 opacity-0 invisible pointer-events-none"
        }`}
      >
        <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Share via
        </div>
        
        <div className="grid grid-cols-3 gap-1 mb-1">
          {sharePlatforms.map(({ name, Icon, createUrl }) => (
            <Link
              key={name}
              href={createUrl(shareUrl, shareText)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors group"
              title={`Share on ${name}`}
            >
              <Icon className="h-5 w-5 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              <span className="text-[9px] font-medium">{name}</span>
            </Link>
          ))}
        </div>

        <button
          onClick={copyToClipboard}
          className="w-full flex items-center px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          Copy Link
        </button>

        <div className="my-1.5 h-px bg-border w-full" />
        
        <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Review us on
        </div>
        
        <div className="flex items-center justify-around gap-1">
          {reviewPlatforms.map((platform) => (
            <Link
              key={platform.name}
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-md hover:bg-muted transition-colors flex items-center justify-center group"
              title={`${platform.name} review`}
            >
              <Image
                src={platform.logo}
                alt={platform.name}
                width={20}
                height={20}
                className="grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}