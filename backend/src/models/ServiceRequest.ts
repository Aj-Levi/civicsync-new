import { Schema, model, Document, Types } from "mongoose";

// ── Types ──────────────────────────────────────────────────────────────────────
export type ServiceType =
  | "electricity"
  | "water"
  | "gas"
  | "sanitation"
  | "waste_management";
export type ConnectionRequestType =
  | "new_connection"
  | "reconnection"
  | "meter_replacement"
  | "load_change"
  | "disconnection";
export type ServiceRequestStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "processing"
  | "completed";

export interface IUploadedDocument {
  type: "id_proof" | "address_proof" | "property_document" | "other";
  url: string; // Cloudinary URL
  name: string; // original filename
  uploadedAt: Date;
}

export interface ISRStatusEntry {
  status: ServiceRequestStatus;
  updatedBy?: Types.ObjectId; // Admin ObjectId
  note?: string;
  timestamp: Date;
}

/**
 * Service request reference number format: SRQ-YYYYMMDD-XXXXX
 *
 * Application fee is collected via Razorpay (same Payment model used for bills).
 * A receipt is generated on payment (feature 15).
 *
 * On completion, the user's utilityConnections array in User model
 * should be updated with the new connectionNumber assigned by the admin.
 */
export interface IServiceRequest extends Document {
  userId: Types.ObjectId; // ref: 'User'
  assignedAdmin?: Types.ObjectId; // ref: 'Admin'

  department: Types.ObjectId; // ref: 'Department'
  district: Types.ObjectId; // ref: 'District'

  referenceNumber: string; // unique — SRQ-YYYYMMDD-XXXXX
  serviceType: ServiceType;
  requestType: ConnectionRequestType;

  // Applicant info (may differ from the User profile in edge cases)
  applicantName: string;
  contactPhone: string;
  address: {
    houseNo: string;
    street: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };

  documents: IUploadedDocument[]; // feature 14 — required ID + address proof
  additionalNotes?: string;

  applicationFee: number;
  paymentId?: Types.ObjectId; // ref: 'Payment'

  status: ServiceRequestStatus;
  statusHistory: ISRStatusEntry[];

  estimatedCompletionDate?: Date;
  completedAt?: Date;
  feedback?: Types.ObjectId; // ref: 'Feedback' — triggered on completion

  createdAt: Date;
  updatedAt: Date;
}

// ── Sub-schemas ─────────────────────────────────────────────────────────────────
const documentSchema = new Schema<IUploadedDocument>(
  {
    type: {
      type: String,
      enum: ["id_proof", "address_proof", "property_document", "other"],
      required: true,
    },
    url: { type: String, required: true },
    name: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const srStatusEntrySchema = new Schema<ISRStatusEntry>(
  {
    status: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "processing",
        "completed",
      ],
      required: true,
    },
    updatedBy: { type: Schema.Types.ObjectId },
    note: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

// ── Main Schema ─────────────────────────────────────────────────────────────────
const serviceRequestSchema = new Schema<IServiceRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedAdmin: { type: Schema.Types.ObjectId, ref: "Admin" },

    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    district: { type: Schema.Types.ObjectId, ref: "District", required: true },

    referenceNumber: { type: String, required: true, unique: true },
    serviceType: {
      type: String,
      enum: ["electricity", "water", "gas", "sanitation", "waste_management"],
      required: true,
    },
    requestType: {
      type: String,
      enum: [
        "new_connection",
        "reconnection",
        "meter_replacement",
        "load_change",
        "disconnection",
      ],
      required: true,
    },

    applicantName: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true },
    address: {
      houseNo: { type: String, required: true },
      street: { type: String, required: true },
      landmark: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },

    documents: { type: [documentSchema], default: [] },
    additionalNotes: { type: String },

    applicationFee: { type: Number, required: true, default: 0 },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },

    status: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "processing",
        "completed",
      ],
      default: "submitted",
    },
    statusHistory: { type: [srStatusEntrySchema], default: [] },

    estimatedCompletionDate: { type: Date },
    completedAt: { type: Date },
    feedback: { type: Schema.Types.ObjectId, ref: "Feedback" },
  },
  { timestamps: true },
);

serviceRequestSchema.index({ userId: 1, status: 1 });
serviceRequestSchema.index({ district: 1, department: 1, status: 1 });
serviceRequestSchema.index({ assignedAdmin: 1, status: 1 });

export const ServiceRequest = model<IServiceRequest>(
  "ServiceRequest",
  serviceRequestSchema,
);
