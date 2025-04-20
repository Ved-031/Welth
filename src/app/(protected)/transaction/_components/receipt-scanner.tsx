"use client";

import { toast } from "sonner";
import { useRef, useState } from "react";
import { CameraIcon, Loader2Icon } from "lucide-react";

import { scanReceipt } from "@/actions/transaction";
import { Button } from "@/components/ui/button";

interface ReceiptScannerProps {
    onScanComplete: (scannedData: {
        amount: number;
        date: Date;
        description: string;
        merchantName: string;
        category: string;
    }) => void;
}

export const ReceiptScanner = ({ onScanComplete }: ReceiptScannerProps) => {

    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleScanComplete = async (file: File) => {
        if(file.size > 5 * 1024 * 1024) {
            toast.error("File size should be less than 5MB.");
            return;
        }
        try {
            setLoading(true);
            const res = await scanReceipt(file);
            onScanComplete(res);
            toast.success("Receipt scanned successfully!");
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if(file) handleScanComplete(file);
                }}
            />
            <Button
                type="button"
                variant="outline"
                disabled={loading}
                className="w-full h-10 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white"
                onClick={() => fileInputRef.current?.click()}
            >
                {loading ? (
                    <>
                        <Loader2Icon className="size-4 animate-spin mr-2" />
                        <span>Scanning receipt...</span>
                    </>
                    ) : (
                    <>
                        <CameraIcon className="mr-2" />
                        <span>Scan Receipt with AI</span>
                    </>
                    )}
            </Button>
        </div>
    )
}
