// import React, { useState } from 'react';
// import {
//   View, Text, TextInput, TouchableOpacity,
//   ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal
// } from 'react-native';
// import { Truck, ShieldCheck, Scale, Send, Package, X, User, MessageCircle } from 'lucide-react-native';
// import { useApiClient } from '@/services/api';
// import { useUserStore } from '@/store/userStore';
// import { Colors } from '@/constants/Colors';
// import { Alert } from 'react-native';
// import { MotiView } from 'moti';

// interface SpecialDeliveryModalProps {
//   visible: boolean;
//   onClose: () => void;
//   product: any;
//   onSuccess: () => void;
// }

// export default function SpecialDeliveryModal({ visible, onClose, product, onSuccess }: SpecialDeliveryModalProps) {
//   const api = useApiClient();
//   const { profile } = useUserStore();

//   const [name, setName] = useState(profile?.name || "");
//   const [quantity, setQuantity] = useState(product?.minOrderQuantity?.toString() || "1");
//   const [message, setMessage] = useState("");
//   const [isSending, setIsSending] = useState(false);

//   const isFarmer = product?.sellerType === 'farmer';
//   const seller = isFarmer ? product?.farmer : product?.agent;
//   const sellerId = isFarmer ? product?.farmerId : product?.agentId;
//   const sellerName = isFarmer ? seller?.name : (seller?.companyName || seller?.name);

//   const handleSend = async () => {
//     if (!name.trim()) {
//       Alert.alert("Required", "Please enter your name.");
//       return;
//     }

//     if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
//       Alert.alert("Required", "Please enter a valid quantity.");
//       return;
//     }

//     setIsSending(true);

//     try {
//       const payload = {
//         action: "create_and_send",
//         productId: product.id,
//         quantity: Number(quantity),
//         sellerId: sellerId,
//         unit: product.unit,
//         name: name.trim(),
//         message: message.trim(),
//         productName: product.productName
//       };

//       const res = await api.post('mobile/v1/special-delivery', payload);

//       if (res?.success) {
//         Alert.alert(
//           "Request Sent!", 
//           "Mediation initiated. Admin will review soon.",
//           [{ text: "OK", onPress: () => {
//             onSuccess();
//             onClose();
//           }}]
//         );
//       } else {
//         throw new Error(res?.error || "Failed to submit request.");
//       }
//     } catch (err: any) {
//       console.error(err);
//       Alert.alert("Error", err.message || "Failed to initiate mediation.");
//     } finally {
//       setIsSending(false);
//     }
//   };

//   return (
//     <Modal visible={visible} transparent animationType="slide">
//       <KeyboardAvoidingView 
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         className="flex-1 justify-end bg-black/50"
//       >
//         <MotiView 
//           from={{ translateY: 300 }}
//           animate={{ translateY: 0 }}
//           className="bg-white rounded-t-3xl max-h-[90%]"
//         >
//           {/* Header */}
//           <View className="bg-slate-900 rounded-t-3xl p-6 pb-8">
//             <View className="flex-row justify-between items-start mb-2">
//               <View className="flex-row items-center gap-3">
//                 <View className="bg-amber-500 p-2 rounded-xl">
//                   <Truck className="h-6 w-6 text-white" />
//                 </View>
//                 <View>
//                   <Text className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1">
//                     Logistics Mediation
//                   </Text>
//                   <Text className="text-white text-2xl font-black uppercase">
//                     Special Delivery
//                   </Text>
//                 </View>
//               </View>
//               <TouchableOpacity onPress={onClose} className="p-2 bg-white/10 rounded-full">
//                 <X color="#fff" size={20} />
//               </TouchableOpacity>
//             </View>
//             <Text className="text-slate-400 font-bold text-sm mt-2">
//               Request a custom logistics quote for out-of-range delivery.
//             </Text>
//           </View>

//           <ScrollView className="px-6 py-6" showsVerticalScrollIndicator={false}>
//             {/* Product Summary */}
//             <View className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex-row items-center mb-6">
//               <View className="w-12 h-12 bg-white rounded-xl items-center justify-center border border-gray-100 mr-4">
//                 <Package color="#059669" size={24} />
//               </View>
//               <View>
//                 <Text className="font-bold text-gray-900 text-base">{product?.productName}</Text>
//                 <Text className="text-emerald-700 font-bold text-xs mt-1">₹{product?.pricePerUnit}/{product?.unit}</Text>
//               </View>
//             </View>

//             {/* Form */}
//             <View className="space-y-5 mb-6">
//               <View>
//                 <View className="flex-row items-center mb-2">
//                   <User size={16} color="#059669" className="mr-2" />
//                   <Text className="text-sm font-bold text-gray-700">Your Name *</Text>
//                 </View>
//                 <TextInput
//                   value={name}
//                   onChangeText={setName}
//                   placeholder="e.g. Rajesh Kumar"
//                   className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base"
//                 />
//               </View>

//               <View>
//                 <View className="flex-row items-center mb-2">
//                   <Package size={16} color="#059669" className="mr-2" />
//                   <Text className="text-sm font-bold text-gray-700">Quantity of {product?.productName} *</Text>
//                 </View>
//                 <View className="relative flex-row items-center">
//                   <TextInput
//                     value={quantity}
//                     onChangeText={setQuantity}
//                     keyboardType="numeric"
//                     placeholder="0.00"
//                     className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 pr-20 text-lg font-bold"
//                   />
//                   <View className="absolute right-3 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
//                     <Text className="text-emerald-700 text-[10px] font-black uppercase">{product?.unit}</Text>
//                   </View>
//                 </View>
//               </View>

//               <View>
//                 <View className="flex-row items-center mb-2">
//                   <MessageCircle size={16} color="#059669" className="mr-2" />
//                   <Text className="text-sm font-bold text-gray-700">Your Message (Optional)</Text>
//                 </View>
//                 <TextInput
//                   value={message}
//                   onChangeText={setMessage}
//                   placeholder="Ask about quality, delivery time..."
//                   multiline
//                   numberOfLines={4}
//                   className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base min-h-[100px]"
//                   textAlignVertical="top"
//                 />
//               </View>
//             </View>

//             {/* Trust Indicators */}
//             <View className="flex-row gap-3 mb-8">
//               <View className="flex-1 flex-row items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
//                 <ShieldCheck size={20} color="#4f46e5" className="mr-2" />
//                 <View>
//                   <Text className="text-[10px] font-black uppercase text-slate-900">Secure Mediation</Text>
//                 </View>
//               </View>
//               <View className="flex-1 flex-row items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
//                 <Scale size={20} color="#d97706" className="mr-2" />
//                 <View>
//                   <Text className="text-[10px] font-black uppercase text-slate-900">Fair Pricing</Text>
//                 </View>
//               </View>
//             </View>

//           </ScrollView>

//           <View className="p-6 border-t border-gray-100 bg-white pb-10">
//             <TouchableOpacity
//               onPress={handleSend}
//               disabled={isSending}
//               className={`bg-emerald-600 rounded-2xl py-4 flex-row items-center justify-center shadow-lg shadow-emerald-600/30 ${isSending ? 'opacity-70' : ''}`}
//             >
//               {isSending ? (
//                 <>
//                   <ActivityIndicator color="#fff" className="mr-3" />
//                   <Text className="text-white font-bold text-lg">Processing...</Text>
//                 </>
//               ) : (
//                 <>
//                   <Send color="#fff" size={20} className="mr-3" />
//                   <Text className="text-white font-bold text-lg">Send Request</Text>
//                 </>
//               )}
//             </TouchableOpacity>
//             <Text className="text-center text-xs text-gray-400 mt-3 font-medium">
//               Admin will mediate this conversation to ensure security.
//             </Text>
//           </View>
//         </MotiView>
//       </KeyboardAvoidingView>
//     </Modal>
//   );
// }


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ===================================================================
// BEFORE AND AFTER UPDATING THE UI 
// ===================================================================
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


// import React, { useState } from 'react';
// import {
//   View, Text, TextInput, TouchableOpacity,
//   ActivityIndicator, KeyboardAvoidingView, Platform,
//   ScrollView, Modal, StyleSheet, Dimensions,
// } from 'react-native';
// import {
//   Truck, ShieldCheck, Scale, Send, Package, X, User, MessageCircle,
// } from 'lucide-react-native';
// import { useApiClient } from '@/services/api';
// import { useUserStore } from '@/store/userStore';
// import { Alert } from 'react-native';
// import { MotiView } from 'moti';
// import { LinearGradient } from 'expo-linear-gradient';

// const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// interface SpecialDeliveryModalProps {
//   visible: boolean;
//   onClose: () => void;
//   product: any;
//   onSuccess: () => void;
// }

// export default function SpecialDeliveryModal({
//   visible, onClose, product, onSuccess,
// }: SpecialDeliveryModalProps) {
//   const api = useApiClient();
//   const { profile } = useUserStore();

//   // ── All existing state & logic unchanged ─────────────────────────
//   const [name, setName] = useState(profile?.name || '');
//   const [quantity, setQuantity] = useState(product?.minOrderQuantity?.toString() || '1');
//   const [message, setMessage] = useState('');
//   const [isSending, setIsSending] = useState(false);

//   const isFarmer = product?.sellerType === 'farmer';
//   const seller = isFarmer ? product?.farmer : product?.agent;
//   const sellerId = isFarmer ? product?.farmerId : product?.agentId;
//   const sellerName = isFarmer ? seller?.name : (seller?.companyName || seller?.name);

//   const handleSend = async () => {
//     if (!name.trim()) {
//       Alert.alert('Required', 'Please enter your name.');
//       return;
//     }
//     if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
//       Alert.alert('Required', 'Please enter a valid quantity.');
//       return;
//     }

//     setIsSending(true);
//     try {
//       const payload = {
//         action: 'create_and_send',
//         productId: product.id,
//         quantity: Number(quantity),
//         sellerId: sellerId,
//         unit: product.unit,
//         name: name.trim(),
//         message: message.trim(),
//         productName: product.productName,
//       };

//       const res = await api.post('mobile/v1/special-delivery', payload);

//       if (res?.success) {
//         Alert.alert(
//           'Request Sent!',
//           'Mediation initiated. Admin will review soon.',
//           [{ text: 'OK', onPress: () => { onSuccess(); onClose(); } }]
//         );
//       } else {
//         throw new Error(res?.error || 'Failed to submit request.');
//       }
//     } catch (err: any) {
//       console.error(err);
//       Alert.alert('Error', err.message || 'Failed to initiate mediation.');
//     } finally {
//       setIsSending(false);
//     }
//   };

//   // ── Focused field state (UI only) ────────────────────────────────
//   const [focusedField, setFocusedField] = useState<string | null>(null);

//   return (
//     <Modal visible={visible} transparent animationType="slide">
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.overlay}
//       >
//         {/* Backdrop tap to close */}
//         <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

//         <MotiView
//           from={{ translateY: 340, opacity: 0 }}
//           animate={{ translateY: 0, opacity: 1 }}
//           transition={{ type: 'spring', damping: 20, stiffness: 160 }}
//           style={styles.sheet}
//         >
//           {/* ── Drag handle ── */}
//           <View style={styles.dragHandle} />

//           {/* ── Header ── */}
//           <LinearGradient
//             colors={['#0f2419', '#1a3a28']}
//             start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//             style={styles.header}
//           >
//             {/* Decorative circles */}
//             <View style={styles.headerCircle1} />
//             <View style={styles.headerCircle2} />

//             <View style={styles.headerTop}>
//               <View style={styles.headerLeft}>
//                 <View style={styles.truckBadge}>
//                   <Truck color="#fff" size={18} />
//                 </View>
//                 <View>
//                   <Text style={styles.headerEyebrow}>Logistics Mediation</Text>
//                   <Text style={styles.headerTitle}>Special Delivery</Text>
//                 </View>
//               </View>
//               <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
//                 <X color="#fff" size={18} />
//               </TouchableOpacity>
//             </View>

//             <Text style={styles.headerSub}>
//               Request a custom logistics quote for out-of-range delivery.
//             </Text>
//           </LinearGradient>

//           <ScrollView
//             style={styles.scrollArea}
//             contentContainerStyle={styles.scrollContent}
//             showsVerticalScrollIndicator={false}
//             keyboardShouldPersistTaps="handled"
//           >
//             {/* ── Product Summary Card ── */}
//             <View style={styles.productCard}>
//               <View style={styles.productIconWrap}>
//                 <Package color="#15803d" size={22} />
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Text style={styles.productName} numberOfLines={1}>{product?.productName}</Text>
//                 <Text style={styles.productPrice}>₹{product?.pricePerUnit} / {product?.unit}</Text>
//               </View>
//               {sellerName ? (
//                 <View style={styles.sellerPill}>
//                   <Text style={styles.sellerPillText} numberOfLines={1}>{sellerName}</Text>
//                 </View>
//               ) : null}
//             </View>

//             {/* ── Form Fields ── */}
//             <View style={styles.formGroup}>
//               {/* Name */}
//               <View style={styles.fieldWrap}>
//                 <View style={styles.fieldLabel}>
//                   <User size={14} color="#15803d" />
//                   <Text style={styles.fieldLabelText}>Your Name <Text style={styles.required}>*</Text></Text>
//                 </View>
//                 <View style={[styles.inputWrap, focusedField === 'name' && styles.inputWrapFocused]}>
//                   <TextInput
//                     value={name}
//                     onChangeText={setName}
//                     placeholder="e.g. Rajesh Kumar"
//                     placeholderTextColor="#a0b8ab"
//                     style={styles.input}
//                     onFocus={() => setFocusedField('name')}
//                     onBlur={() => setFocusedField(null)}
//                   />
//                 </View>
//               </View>

//               {/* Quantity */}
//               <View style={styles.fieldWrap}>
//                 <View style={styles.fieldLabel}>
//                   <Package size={14} color="#15803d" />
//                   <Text style={styles.fieldLabelText}>
//                     Quantity <Text style={styles.required}>*</Text>
//                   </Text>
//                 </View>
//                 <View style={[styles.inputWrap, focusedField === 'qty' && styles.inputWrapFocused, styles.inputWrapRow]}>
//                   <TextInput
//                     value={quantity}
//                     onChangeText={setQuantity}
//                     keyboardType="numeric"
//                     placeholder="0"
//                     placeholderTextColor="#a0b8ab"
//                     style={[styles.input, { flex: 1, fontSize: 20, fontWeight: '900', color: '#0a1f12' }]}
//                     onFocus={() => setFocusedField('qty')}
//                     onBlur={() => setFocusedField(null)}
//                   />
//                   <View style={styles.unitBadge}>
//                     <Text style={styles.unitBadgeText}>{product?.unit}</Text>
//                   </View>
//                 </View>
//               </View>

//               {/* Message */}
//               <View style={styles.fieldWrap}>
//                 <View style={styles.fieldLabel}>
//                   <MessageCircle size={14} color="#15803d" />
//                   <Text style={styles.fieldLabelText}>Message <Text style={styles.optional}>(optional)</Text></Text>
//                 </View>
//                 <View style={[styles.inputWrap, styles.textareaWrap, focusedField === 'msg' && styles.inputWrapFocused]}>
//                   <TextInput
//                     value={message}
//                     onChangeText={setMessage}
//                     placeholder="Ask about quality, delivery timeline, packaging…"
//                     placeholderTextColor="#a0b8ab"
//                     multiline
//                     numberOfLines={4}
//                     style={[styles.input, styles.textarea]}
//                     textAlignVertical="top"
//                     onFocus={() => setFocusedField('msg')}
//                     onBlur={() => setFocusedField(null)}
//                   />
//                 </View>
//               </View>
//             </View>

//             {/* ── Trust Chips ── */}
//             <View style={styles.trustRow}>
//               <View style={styles.trustChip}>
//                 <View style={[styles.trustIcon, { backgroundColor: '#eef2ff' }]}>
//                   <ShieldCheck size={16} color="#4f46e5" />
//                 </View>
//                 <View>
//                   <Text style={styles.trustTitle}>Secure</Text>
//                   <Text style={styles.trustSub}>Admin mediated</Text>
//                 </View>
//               </View>
//               <View style={styles.trustChip}>
//                 <View style={[styles.trustIcon, { backgroundColor: '#fffbeb' }]}>
//                   <Scale size={16} color="#d97706" />
//                 </View>
//                 <View>
//                   <Text style={styles.trustTitle}>Fair Price</Text>
//                   <Text style={styles.trustSub}>Transparent quote</Text>
//                 </View>
//               </View>
//               <View style={styles.trustChip}>
//                 <View style={[styles.trustIcon, { backgroundColor: '#f0fdf4' }]}>
//                   <Truck size={16} color="#16a34a" />
//                 </View>
//                 <View>
//                   <Text style={styles.trustTitle}>Tracked</Text>
//                   <Text style={styles.trustSub}>End-to-end</Text>
//                 </View>
//               </View>
//             </View>
//           </ScrollView>

//           {/* ── Footer CTA ── */}
//           <View style={styles.footer}>
//             <TouchableOpacity
//               onPress={handleSend}
//               disabled={isSending}
//               style={[styles.sendBtn, isSending && styles.sendBtnDisabled]}
//               activeOpacity={0.85}
//             >
//               <LinearGradient
//                 colors={isSending ? ['#86efac', '#86efac'] : ['#15803d', '#16a34a']}
//                 start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//                 style={styles.sendBtnGradient}
//               >
//                 {isSending ? (
//                   <View style={styles.sendBtnInner}>
//                     <ActivityIndicator color="#fff" size="small" />
//                     <Text style={styles.sendBtnText}>Processing…</Text>
//                   </View>
//                 ) : (
//                   <View style={styles.sendBtnInner}>
//                     <Send color="#fff" size={18} />
//                     <Text style={styles.sendBtnText}>Send Request</Text>
//                   </View>
//                 )}
//               </LinearGradient>
//             </TouchableOpacity>

//             <Text style={styles.footerNote}>
//               Admin will mediate this conversation to ensure security.
//             </Text>
//           </View>
//         </MotiView>
//       </KeyboardAvoidingView>
//     </Modal>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   // Overlay
//   overlay: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     backgroundColor: 'rgba(0,0,0,0.52)',
//   },

//   // Sheet
//   sheet: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 28,
//     borderTopRightRadius: 28,
//     maxHeight: SCREEN_HEIGHT * 0.92,
//     overflow: 'hidden',
//   },
//   dragHandle: {
//     width: 40,
//     height: 4,
//     borderRadius: 2,
//     backgroundColor: 'rgba(255,255,255,0.35)',
//     alignSelf: 'center',
//     position: 'absolute',
//     top: 10,
//     zIndex: 10,
//   },

//   // Header
//   header: {
//     paddingTop: 30,
//     paddingBottom: 22,
//     paddingHorizontal: 22,
//     overflow: 'hidden',
//   },
//   headerCircle1: {
//     position: 'absolute',
//     width: 160,
//     height: 160,
//     borderRadius: 80,
//     backgroundColor: 'rgba(74,222,128,0.07)',
//     top: -40,
//     right: -30,
//   },
//   headerCircle2: {
//     position: 'absolute',
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: 'rgba(74,222,128,0.05)',
//     bottom: -20,
//     left: 20,
//   },
//   headerTop: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//     marginBottom: 12,
//   },
//   headerLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   truckBadge: {
//     width: 44,
//     height: 44,
//     borderRadius: 14,
//     backgroundColor: '#d97706',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#d97706',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.35,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   headerEyebrow: {
//     fontSize: 10,
//     fontWeight: '900',
//     color: '#4ade80',
//     letterSpacing: 1.2,
//     textTransform: 'uppercase',
//     marginBottom: 3,
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: '900',
//     color: '#fff',
//     letterSpacing: -0.5,
//   },
//   closeBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: 'rgba(255,255,255,0.12)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerSub: {
//     fontSize: 13,
//     color: '#86a892',
//     fontWeight: '500',
//     lineHeight: 19,
//   },

//   // Scroll
//   scrollArea: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: 10,
//   },

//   // Product Card
//   productCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f0fdf4',
//     borderRadius: 18,
//     padding: 14,
//     borderWidth: 1,
//     borderColor: '#bbf7d0',
//     marginBottom: 22,
//     gap: 12,
//   },
//   productIconWrap: {
//     width: 46,
//     height: 46,
//     borderRadius: 14,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: '#dcfce7',
//     shadowColor: '#15803d',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   productName: {
//     fontSize: 15,
//     fontWeight: '800',
//     color: '#0a1f12',
//     marginBottom: 3,
//   },
//   productPrice: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#15803d',
//   },
//   sellerPill: {
//     backgroundColor: '#fff',
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#bbf7d0',
//     maxWidth: 90,
//   },
//   sellerPillText: {
//     fontSize: 11,
//     fontWeight: '700',
//     color: '#15803d',
//   },

//   // Form
//   formGroup: {
//     gap: 18,
//     marginBottom: 22,
//   },
//   fieldWrap: {},
//   fieldLabel: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     marginBottom: 8,
//   },
//   fieldLabelText: {
//     fontSize: 13,
//     fontWeight: '800',
//     color: '#2d4a38',
//     letterSpacing: 0.1,
//   },
//   required: {
//     color: '#dc2626',
//     fontWeight: '900',
//   },
//   optional: {
//     fontSize: 12,
//     fontWeight: '500',
//     color: '#86a892',
//   },
//   inputWrap: {
//     backgroundColor: '#f8fbf9',
//     borderRadius: 16,
//     borderWidth: 1.5,
//     borderColor: '#dde8e2',
//     overflow: 'hidden',
//   },
//   inputWrapFocused: {
//     borderColor: '#16a34a',
//     backgroundColor: '#f0fdf4',
//     shadowColor: '#16a34a',
//     shadowOffset: { width: 0, height: 0 },
//     shadowOpacity: 0.12,
//     shadowRadius: 6,
//     elevation: 2,
//   },
//   inputWrapRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   input: {
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     fontSize: 15,
//     color: '#0a1f12',
//     fontWeight: '600',
//   },
//   textareaWrap: {
//     minHeight: 110,
//   },
//   textarea: {
//     minHeight: 100,
//     paddingTop: 14,
//   },
//   unitBadge: {
//     marginRight: 12,
//     backgroundColor: '#dcfce7',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#bbf7d0',
//   },
//   unitBadgeText: {
//     fontSize: 11,
//     fontWeight: '900',
//     color: '#15803d',
//     textTransform: 'uppercase',
//     letterSpacing: 0.8,
//   },

//   // Trust Chips
//   trustRow: {
//     flexDirection: 'row',
//     gap: 8,
//     marginBottom: 8,
//   },
//   trustChip: {
//     flex: 1,
//     backgroundColor: '#f8fbf9',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: '#dde8e2',
//     padding: 12,
//     alignItems: 'center',
//     gap: 8,
//   },
//   trustIcon: {
//     width: 36,
//     height: 36,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   trustTitle: {
//     fontSize: 11,
//     fontWeight: '800',
//     color: '#0a1f12',
//     textAlign: 'center',
//   },
//   trustSub: {
//     fontSize: 10,
//     fontWeight: '500',
//     color: '#86a892',
//     textAlign: 'center',
//   },

//   // Footer
//   footer: {
//     paddingHorizontal: 20,
//     paddingTop: 16,
//     paddingBottom: 32,
//     borderTopWidth: 1,
//     borderTopColor: '#edf2ef',
//     backgroundColor: '#fff',
//   },
//   sendBtn: {
//     borderRadius: 20,
//     overflow: 'hidden',
//     marginBottom: 12,
//     shadowColor: '#15803d',
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.3,
//     shadowRadius: 12,
//     elevation: 6,
//   },
//   sendBtnDisabled: {
//     opacity: 0.6,
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   sendBtnGradient: {
//     paddingVertical: 17,
//     paddingHorizontal: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   sendBtnInner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   sendBtnText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '900',
//     letterSpacing: -0.2,
//   },
//   footerNote: {
//     textAlign: 'center',
//     fontSize: 12,
//     color: '#a0b8ab',
//     fontWeight: '500',
//     lineHeight: 17,
//   },
// });




import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Modal, StyleSheet, Dimensions,
} from 'react-native';
import {
  Truck, ShieldCheck, Scale, Send, Package, X, User, MessageCircle,
} from 'lucide-react-native';
import { useApiClient } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { Alert } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SpecialDeliveryModalProps {
  visible: boolean;
  onClose: () => void;
  product: any;
  onSuccess: () => void;
}

export default function SpecialDeliveryModal({
  visible, onClose, product, onSuccess,
}: SpecialDeliveryModalProps) {
  const api = useApiClient();
  const { profile } = useUserStore();

  // ── All existing state & logic unchanged ─────────────────────────
  const [name, setName] = useState(profile?.name || '');
  const [quantity, setQuantity] = useState(product?.minOrderQuantity?.toString() || '1');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const isFarmer = product?.sellerType === 'farmer';
  const seller = isFarmer ? product?.farmer : product?.agent;
  const sellerId = isFarmer ? product?.farmerId : product?.agentId;
  const sellerName = isFarmer ? seller?.name : (seller?.companyName || seller?.name);

  const handleSend = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert('Required', 'Please enter a valid quantity.');
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        action: 'create_and_send',
        productId: product.id,
        quantity: Number(quantity),
        sellerId: sellerId,
        unit: product.unit,
        name: name.trim(),
        message: message.trim(),
        productName: product.productName,
      };

      const res = await api.post('mobile/v1/special-delivery', payload);

      if (res?.success) {
        Alert.alert(
          'Request Sent!',
          'Mediation initiated. Admin will review soon.',
          [{ text: 'OK', onPress: () => { onSuccess(); onClose(); } }]
        );
      } else {
        throw new Error(res?.error || 'Failed to submit request.');
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to initiate mediation.');
    } finally {
      setIsSending(false);
    }
  };

  // ── Focused field state (UI only) ────────────────────────────────
  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        {/* Backdrop tap to close */}
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        <MotiView
          from={{ translateY: 340, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 160 }}
          style={styles.sheet}
        >
          {/* ── Drag handle ── */}
          <View style={styles.dragHandle} />

          {/* ── Header ── */}
          <LinearGradient
            colors={['#0f2419', '#1a3a28']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* Decorative circles */}
            <View style={styles.headerCircle1} />
            <View style={styles.headerCircle2} />

            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <View style={styles.truckBadge}>
                  <Truck color="#fff" size={18} />
                </View>
                <View>
                  <Text style={styles.headerEyebrow}>Logistics Mediation</Text>
                  <Text style={styles.headerTitle}>Special Delivery</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <X color="#fff" size={18} />
              </TouchableOpacity>
            </View>

            <Text style={styles.headerSub}>
              Request a custom logistics quote for out-of-range delivery.
            </Text>
          </LinearGradient>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Product Summary Card ── */}
            <View style={styles.productCard}>
              <View style={styles.productIconWrap}>
                <Package color="#15803d" size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName} numberOfLines={1}>{product?.productName}</Text>
                <Text style={styles.productPrice}>₹{product?.pricePerUnit} / {product?.unit}</Text>
              </View>
              {sellerName ? (
                <View style={styles.sellerPill}>
                  <Text style={styles.sellerPillText} numberOfLines={1}>{sellerName}</Text>
                </View>
              ) : null}
            </View>

            {/* ── Form Fields ── */}
            <View style={styles.formGroup}>
              {/* Name */}
              <View style={styles.fieldWrap}>
                <View style={styles.fieldLabel}>
                  <User size={14} color="#15803d" />
                  <Text style={styles.fieldLabelText}>Your Name <Text style={styles.required}>*</Text></Text>
                </View>
                <View style={[styles.inputWrap, focusedField === 'name' && styles.inputWrapFocused]}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Rajesh Kumar"
                    placeholderTextColor="#a0b8ab"
                    style={styles.input}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Quantity */}
              <View style={styles.fieldWrap}>
                <View style={styles.fieldLabel}>
                  <Package size={14} color="#15803d" />
                  <Text style={styles.fieldLabelText}>
                    Quantity <Text style={styles.required}>*</Text>
                  </Text>
                </View>
                <View style={[styles.inputWrap, focusedField === 'qty' && styles.inputWrapFocused, styles.inputWrapRow]}>
                  <TextInput
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#a0b8ab"
                    style={[styles.input, { flex: 1, fontSize: 20, fontWeight: '900', color: '#0a1f12' }]}
                    onFocus={() => setFocusedField('qty')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <View style={styles.unitBadge}>
                    <Text style={styles.unitBadgeText}>{product?.unit}</Text>
                  </View>
                </View>
              </View>

              {/* Message */}
              <View style={styles.fieldWrap}>
                <View style={styles.fieldLabel}>
                  <MessageCircle size={14} color="#15803d" />
                  <Text style={styles.fieldLabelText}>Message <Text style={styles.optional}>(optional)</Text></Text>
                </View>
                <View style={[styles.inputWrap, styles.textareaWrap, focusedField === 'msg' && styles.inputWrapFocused]}>
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Ask about quality, delivery timeline, packaging…"
                    placeholderTextColor="#a0b8ab"
                    multiline
                    numberOfLines={4}
                    style={[styles.input, styles.textarea]}
                    textAlignVertical="top"
                    onFocus={() => setFocusedField('msg')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            </View>

            {/* ── Trust Chips ── */}
            <View style={styles.trustRow}>
              <View style={styles.trustChip}>
                <View style={[styles.trustIcon, { backgroundColor: '#eef2ff' }]}>
                  <ShieldCheck size={16} color="#4f46e5" />
                </View>
                <View>
                  <Text style={styles.trustTitle}>Secure</Text>
                  <Text style={styles.trustSub}>Admin mediated</Text>
                </View>
              </View>
              <View style={styles.trustChip}>
                <View style={[styles.trustIcon, { backgroundColor: '#fffbeb' }]}>
                  <Scale size={16} color="#d97706" />
                </View>
                <View>
                  <Text style={styles.trustTitle}>Fair Price</Text>
                  <Text style={styles.trustSub}>Transparent quote</Text>
                </View>
              </View>
              <View style={styles.trustChip}>
                <View style={[styles.trustIcon, { backgroundColor: '#f0fdf4' }]}>
                  <Truck size={16} color="#16a34a" />
                </View>
                <View>
                  <Text style={styles.trustTitle}>Tracked</Text>
                  <Text style={styles.trustSub}>End-to-end</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* ── Footer CTA ── */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSend}
              disabled={isSending}
              style={[styles.sendBtn, isSending && styles.sendBtnDisabled]}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isSending ? ['#86efac', '#86efac'] : ['#15803d', '#16a34a']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.sendBtnGradient}
              >
                {isSending ? (
                  <View style={styles.sendBtnInner}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.sendBtnText}>Processing…</Text>
                  </View>
                ) : (
                  <View style={styles.sendBtnInner}>
                    <Send color="#fff" size={18} />
                    <Text style={styles.sendBtnText}>Send Request</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.footerNote}>
              Admin will mediate this conversation to ensure security.
            </Text>
          </View>
        </MotiView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Overlay
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.52)',
  },

  // Sheet
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.92,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignSelf: 'center',
    position: 'absolute',
    top: 10,
    zIndex: 10,
  },

  // Header
  header: {
    paddingTop: 30,
    paddingBottom: 22,
    paddingHorizontal: 22,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(74,222,128,0.07)',
    top: -40,
    right: -30,
  },
  headerCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(74,222,128,0.05)',
    bottom: -20,
    left: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  truckBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    color: '#4ade80',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSub: {
    fontSize: 13,
    color: '#86a892',
    fontWeight: '500',
    lineHeight: 19,
  },

  // Scroll
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  // Product Card
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 22,
    gap: 12,
  },
  productIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dcfce7',
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  productName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0a1f12',
    marginBottom: 3,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d',
  },
  sellerPill: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    maxWidth: 90,
  },
  sellerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },

  // Form
  formGroup: {
    gap: 18,
    marginBottom: 22,
  },
  fieldWrap: {},
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  fieldLabelText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2d4a38',
    letterSpacing: 0.1,
  },
  required: {
    color: '#dc2626',
    fontWeight: '900',
  },
  optional: {
    fontSize: 12,
    fontWeight: '500',
    color: '#86a892',
  },
  inputWrap: {
    backgroundColor: '#f8fbf9',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#dde8e2',
    overflow: 'hidden',
  },
  inputWrapFocused: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  inputWrapRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0a1f12',
    fontWeight: '600',
  },
  textareaWrap: {
    minHeight: 110,
  },
  textarea: {
    minHeight: 100,
    paddingTop: 14,
  },
  unitBadge: {
    marginRight: 12,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  unitBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#15803d',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Trust Chips
  trustRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  trustChip: {
    flex: 1,
    backgroundColor: '#f8fbf9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dde8e2',
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  trustIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0a1f12',
    textAlign: 'center',
  },
  trustSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#86a892',
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#edf2ef',
    backgroundColor: '#fff',
  },
  sendBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  sendBtnDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnGradient: {
    paddingVertical: 17,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#a0b8ab',
    fontWeight: '500',
    lineHeight: 17,
  },
});