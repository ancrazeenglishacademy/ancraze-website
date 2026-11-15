import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import * as admin from "firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    let enquiries: any[] = [];

    if (adminDb) {
      let snapshot;
      try {
        if (statusFilter && statusFilter !== "all") {
          snapshot = await adminDb
            .collection("enquiries")
            .where("status", "==", statusFilter)
            .get();
        } else {
          snapshot = await adminDb.collection("enquiries").get();
        }
      } catch (err) {
        console.warn("Falling back to unindexed query:", err);
        snapshot = await adminDb.collection("enquiries").get();
      }

      enquiries = snapshot.docs.map((docSnap: any) => {
        const data = docSnap.data();
        const createdAt = data.createdAt?.toDate?.()
          ? data.createdAt.toDate().toISOString()
          : data.createdAt || data.createdAtMs
          ? new Date(data.createdAtMs || data.createdAt).toISOString()
          : new Date().toISOString();

        return {
          id: docSnap.id,
          fullName: data.fullName || "Prospective Student",
          phone: data.phone || "",
          course: data.course || "General Inquiry",
          message: data.message || "",
          status: data.status || "new", // 'new' | 'contacted' | 'enrolled' | 'closed'
          notes: data.notes || "",
          source: data.source || "quick_enquiry",
          createdAt,
          createdAtMs: data.createdAtMs || (data.createdAt?.toMillis?.() || Date.now()),
        };
      });
    } else {
      // Fallback to client Firestore
      const snap = await getDocs(collection(db, "enquiries"));
      enquiries = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          fullName: data.fullName || "Prospective Student",
          phone: data.phone || "",
          course: data.course || "General Inquiry",
          message: data.message || "",
          status: data.status || "new",
          notes: data.notes || "",
          source: data.source || "quick_enquiry",
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          createdAtMs: data.createdAtMs || Date.now(),
        };
      });
    }

    // Sort descending by date (newest first)
    enquiries.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime() || a.createdAtMs || 0;
      const timeB = new Date(b.createdAt).getTime() || b.createdAtMs || 0;
      return timeB - timeA;
    });

    if (statusFilter && statusFilter !== "all") {
      enquiries = enquiries.filter((e) => e.status === statusFilter);
    }

    return NextResponse.json({ success: true, enquiries });
  } catch (error: any) {
    console.error("❌ Error fetching enquiries:", error);
    return NextResponse.json(
      { error: "Failed to fetch enquiries", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, phone, course, message, source } = body;

    if (!fullName || !phone) {
      return NextResponse.json(
        { error: "Full Name and Phone Number are required." },
        { status: 400 }
      );
    }

    const payload = {
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      course: course ? String(course).trim() : "General Inquiry",
      message: message ? String(message).trim() : "",
      status: "new",
      notes: "",
      source: source || "quick_enquiry_form",
      createdAtMs: Date.now(),
    };

    let docId = "";

    if (adminDb) {
      const ref = await (adminDb as any).collection("enquiries").add({
        ...payload,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      docId = ref.id;
    } else {
      const ref = await addDoc(collection(db, "enquiries"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
      docId = ref.id;
    }

    return NextResponse.json({
      success: true,
      id: docId,
      message: "Enquiry submitted successfully! Our team will contact you shortly.",
    });
  } catch (error: any) {
    console.error("❌ Error submitting enquiry:", error);
    return NextResponse.json(
      { error: "Failed to submit enquiry. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Enquiry ID is required" }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    if (adminDb) {
      await (adminDb as any).collection("enquiries").doc(id).update(updates);
    } else {
      await updateDoc(doc(db, "enquiries", id), updates);
    }

    return NextResponse.json({ success: true, message: "Enquiry updated successfully" });
  } catch (error: any) {
    console.error("❌ Error updating enquiry:", error);
    return NextResponse.json(
      { error: "Failed to update enquiry", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Enquiry ID is required" }, { status: 400 });
    }

    if (adminDb) {
      await (adminDb as any).collection("enquiries").doc(id).delete();
    } else {
      await deleteDoc(doc(db, "enquiries", id));
    }

    return NextResponse.json({ success: true, message: "Enquiry deleted successfully" });
  } catch (error: any) {
    console.error("❌ Error deleting enquiry:", error);
    return NextResponse.json(
      { error: "Failed to delete enquiry", details: error.message },
      { status: 500 }
    );
  }
}
