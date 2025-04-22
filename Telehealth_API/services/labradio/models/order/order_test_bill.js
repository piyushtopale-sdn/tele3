import mongoose from "mongoose";

const testBillSchema = new mongoose.Schema(
  {
    total_test_cost: {
      type: String,
    },
    mode: {
      type: String,
    },
    prescription_url: {
      type: Array,
    },
    for_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "OrderDetail",
    },
    for_portal_user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "PortalUser",
    },
    portal_type: {
      type: String,
      enum: ["Radiology", "Laboratory"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("OrdertestBill", testBillSchema);
