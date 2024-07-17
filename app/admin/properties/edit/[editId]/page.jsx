"use client"
import React, { useEffect, useRef, useState } from 'react'
import { Checkbox, Input, Select, SelectItem, Textarea, Button, Progress, CheckboxGroup, DateRangePicker, Card, CardBody } from "@nextui-org/react";
import { useFirebase } from '@/app/context/Firebase';
import { toast } from 'sonner';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';

import { parseDate, getLocalTimeZone, today } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { CheckCircleIcon, DeleteIcon, UploadIcon } from '@/components/icons';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import Image from 'next/image';
import { useRouter } from 'next/navigation';


const conditionCollaction = [
    { key: "new", label: "New" },
    { key: "old", label: "Old" },
];

const bedroomsCollaction = [
    { key: "1", label: "1 Bedroom" },
    { key: "2", label: "2 Bedrooms" },
    { key: "3", label: "3 Bedrooms" },
    { key: "4", label: "4 Bedrooms" },
    { key: "5", label: "5 Bedrooms" },
    { key: "5+", label: "5+ Bedrooms" },
];

const bathroomsCollaction = [
    { key: "1", label: "1 Bathroom" },
    { key: "2", label: "2 Bathrooms" },
    { key: "3", label: "3 Bathrooms" },
    { key: "4", label: "4 Bathrooms" },
    { key: "5", label: "5 Bathrooms" },
    { key: "5+", label: "5+ Bathrooms" },
];

const parkingspotsCollaction = [
    { key: "1", label: "1 Parking" },
    { key: "2", label: "2 Parkings" },
    { key: "3", label: "3 Parkings" },
    { key: "4", label: "4 Parkings" },
    { key: "5", label: "5 Parkings" },
    { key: "5+", label: "5+ Parkings" },
];


const EditPage = ({ params }) => {
    const { firebaseDB, firebaseStorage } = useFirebase();
    const router = useRouter();

    const [data, setData] = useState({});
    const [propertyTypeCollaction, setPropertyTypeCollaction] = useState();
    const [locationsCollaction, setLocationsCollaction] = useState();
    const [amenitiesCollaction, setAmenitiesCollaction] = useState();

    const [loading, setLoading] = useState(false);

    // Banner
    const bannerFileRef = useRef(null);
    const [banner, setBanner] = useState(null);
    const [initialBanner, setInitialBanner] = React.useState(null);

    const imagesFileRef = useRef(null);
    const [images, setImages] = useState([]);
    const [prevImagesSnapshot, setPrevImagesSnapshot] = useState([]);

    // Main Details
    const [title, setTitle] = useState('');
    const [type, setType] = useState({ id: data?.type?.id, type: data?.type?.type });

    const [sale_price, setSale_price] = useState('');
    const [condition, setCondition] = useState(new Set([conditionCollaction?.[0]?.key]));
    const [isVarified, setIsVarified] = useState(false);
    const [overview, setOverview] = useState('');

    // Address Details
    const [area, setArea] = useState(new Set([locationsCollaction?.[0]?.id]));
    const [fullAddress, setFullAddress] = useState('');

    // Images

    // Property Details
    const [apartment_area, setApartment_area] = useState();
    const [bedrooms, setBedrooms] = useState(new Set([bedroomsCollaction?.[0]?.key]));
    const [bathrooms, setBathrooms] = useState(new Set([bathroomsCollaction?.[0]?.key]));
    const [parking_places, setParking_places] = useState(new Set([parkingspotsCollaction?.[0]?.key]));
    const [pets_allowed, setPets_allowed] = useState([]);
    const [amenities, setAmenities] = useState([]);

    // Contacts
    const [first_name, setFirst_name] = useState('');
    const [sure_name, setSure_name] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const [built, setBuilt] = React.useState({
        start: parseDate("2024-04-01"),
        end: parseDate("2024-04-08"),
    });
    let formatter = useDateFormatter({ dateStyle: "long" });



    const fetchDataFromDB = async () => {
        try {
            const collectionRef = collection(firebaseDB, "properties");
            const docRef = doc(collectionRef, params?.editId);
            const docSnap = await getDoc(docRef);
            setData(docSnap.data());
            if (!docSnap.exists()) {
                toast.error("No such property!", {
                    description: 'Please select a valid property.',
                });
                router.push('/admin/properties');
            }

        } catch (error) {
            console.log("errorss", error);
        }
    }

    useEffect(() => {
        fetchDataFromDB()
    }, [params])



    useEffect(() => {
        // Banner
        setInitialBanner(data?.banner)

        const imageUrls = data?.images || [];
        setImages(imageUrls.map(url => ({ url, name: url.split("/").pop() })));

        // Main Details
        setTitle(data?.title);
        setType({ id: data?.type?.id, type: data?.type?.type });

        setSale_price(data?.sale_price);
        setCondition(new Set([data?.condition]));
        setIsVarified(data?.isVarified);
        setOverview(data?.overview);

        // Address Details
        setArea({ id: data?.address?.area?.id, location: data?.address?.area?.location });
        setFullAddress(data?.address?.fullAddress);

        // Property Details
        setApartment_area(data?.property_details?.apartment_area);
        setBedrooms(new Set([data?.property_details?.bedrooms]));
        setBathrooms(new Set([data?.property_details?.bathrooms]));
        setParking_places(new Set([data?.property_details?.parking_places]));
        setPets_allowed(data?.property_details?.pets_allowed);
        setAmenities(data?.amenities);

        // Contacts
        setFirst_name(data?.first_name);
        setSure_name(data?.sure_name);
        setEmail(data?.email);
        setPhone(data?.phone);

        const padToTwoDigits = (num) => {
            return num.toString().padStart(2, '0');
        };

        if (data?.property_details?.built?.start?.year) {
            setBuilt({
                start: parseDate(`${data?.property_details?.built?.start?.year}-${padToTwoDigits(data?.property_details?.built?.start?.month)}-${padToTwoDigits(data?.property_details?.built?.start?.day)}`),
                end: parseDate(`${data?.property_details?.built?.end?.year}-${padToTwoDigits(data?.property_details?.built?.end?.month)}-${padToTwoDigits(data?.property_details?.built?.end?.day)}`),
            });
        }
    }, [data])



    const [basicInfoProgress, setBasicInfoProgress] = useState(false);
    const [locationProgress, setLocationProgress] = useState(false);
    const [propertyDetailsProgress, setPropertyDetailsProgress] = useState(false);
    const [priceProgress, setPriceProgress] = useState(false);
    const [imagesProgress, setImagesProgress] = useState(false);
    const [contactsProgress, setContactsProgress] = useState(false);

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setBasicInfoProgress((banner !== null || initialBanner !== '') && title !== '' && type?.type !== '' && condition?.label !== '');
    }, [banner, initialBanner, title, type, condition]);

    useEffect(() => {
        setLocationProgress(area?.id !== null && fullAddress !== '');
    }, [area, fullAddress]);

    useEffect(() => {
        setPropertyDetailsProgress(apartment_area !== '' && Array.from(bedrooms)[0] !== undefined && Array.from(bathrooms)[0] !== undefined && Array.from(parking_places)[0] !== undefined && overview !== '');
    }, [apartment_area, bedrooms, bathrooms, parking_places, overview]);

    useEffect(() => {
        setPriceProgress(sale_price !== '');
    }, [sale_price]);

    useEffect(() => {
        setImagesProgress(images?.length > 0);
    }, [images]);

    useEffect(() => {
        setContactsProgress(first_name !== '' && sure_name !== '' && email !== '' && phone !== '');
    }, [first_name, sure_name, email, phone]);

    useEffect(() => {
        const totalCriteria = 6;
        const progressWeight = 100 / totalCriteria;

        let newProgress = 0;
        newProgress += basicInfoProgress ? progressWeight : 0;
        newProgress += locationProgress ? progressWeight : 0;
        newProgress += propertyDetailsProgress ? progressWeight : 0;
        newProgress += priceProgress ? progressWeight : 0;
        newProgress += imagesProgress ? progressWeight : 0;
        newProgress += contactsProgress ? progressWeight : 0;

        setProgress(newProgress);
    }, [basicInfoProgress, locationProgress, propertyDetailsProgress, priceProgress, imagesProgress, contactsProgress]);


    const handleTypeChange = (id) => {
        if (id.size === 0) {
            setType({ id: "", type: "" });
        } else {
            const selectedKey = [...id][0];
            const selectedAnimal = propertyTypeCollaction.find(item => item.id === selectedKey);
            setType({ id: selectedAnimal.id, type: selectedAnimal.type });
        }
    };



    const handleAreaChange = (id) => {
        if (id.size === 0) {
            setArea({ id: "", location: "" });
        } else {
            const selectedKey = [...id][0];
            const selectedAnimal = locationsCollaction.find(item => item.id === selectedKey);
            setArea({ id: selectedAnimal?.id, location: selectedAnimal?.location });
        }
    };

    const getProperiyTypes = async () => {
        const collectionRef = collection(firebaseDB, "propertyTypes");
        try {
            const querySnapshot = await getDocs(collectionRef);
            const res = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPropertyTypeCollaction(res)
            // Set default value to first item if available
            if (res.length > 0) {
                setType({ id: res[0].id, type: res[0].type });
            }
        } catch (error) {
            console.error('Error fetching propertyTypes data: ', error);
        }
    }


    const getLocations = async () => {
        const collectionRef = collection(firebaseDB, "locations");
        try {
            const q = query(collectionRef, where("status", "==", true));
            const querySnapshot = await getDocs(q);
            const res = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLocationsCollaction(res)
        } catch (error) {
            console.error('Error fetching locations data: ', error);
        }
    }

    const getAmenities = async () => {
        const collectionRef = collection(firebaseDB, "amenities");
        try {
            const q = query(collectionRef, where("status", "==", true));
            const querySnapshot = await getDocs(q);
            const res = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAmenitiesCollaction(res)
        } catch (error) {
            console.error('Error fetching amenities data: ', error);
        }
    }

    useEffect(() => {
        getProperiyTypes();
        getLocations();
        getAmenities();
    }, []);



    const handleBannerChange = (event) => {
        const file = event?.target?.files[0];
        file?.type?.startsWith("image/") ? setBanner(file) : toast.error("Please select an image file.");
    };

    const handleRemoveBanner = () => {
        setBanner(null);
        if (bannerFileRef.current) {
            bannerFileRef.current.value = "";
        }
    };

    const handleImagesChange = (event) => {
        const files = event.target.files;
        const imageFiles = Array.from(files).filter(file => file.type.startsWith("image/"));
        if (imageFiles.length === 0) {
            toast.error("Please select image files.");
            return;
        }

        setImages(prevImages => {
            let newImages = [...prevImages];
            imageFiles.forEach(file => {
                const index = newImages.findIndex(img => img.name === file.name);
                if (index > -1) {
                    newImages[index] = file; // Replace existing image
                } else {
                    if (newImages.length < 8) {
                        newImages.push(file); // Add new image if less than 8
                    }
                }
            });
            if (newImages.length > 8) {
                newImages = newImages.slice(0, 8);
                toast.error("You can only upload up to 8 images.");
            }
            return newImages;
        });

    };
    const handleRemoveImage = (name) => {
        setImages(prevImages => {
            const newImages = prevImages.filter(image => image.name !== name);
            return newImages;
        });
    };

    useEffect(() => {
        // Updating the input field with the current images
        if (imagesFileRef.current) {
            const dataTransfer = new DataTransfer();
            images.forEach(image => {
                if (image instanceof File) {
                    dataTransfer.items.add(image);
                }
            });
            imagesFileRef.current.files = dataTransfer.files;
        }
    }, [images]);

    const handleFileInputClick = () => {
        setPrevImagesSnapshot([...images]);
    };

    const handleFileInputBlur = () => {
        // Check if any new files were added
        if (imagesFileRef.current && imagesFileRef.current.files.length === 0) {
            setImages(prevImagesSnapshot);
        }
    };



    const payload = {
        title,
        type: {
            id: type?.id,
            type: type?.type,
        },
        sale_price: Number(sale_price),
        condition: Array.from(condition)[0],
        isVarified: Boolean(isVarified),
        overview: String(overview),
        address: {
            area: {
                id: area?.id,
                location: area?.location,
            },
            fullAddress: fullAddress ? String(fullAddress) : '',
        },
        property_details: {
            apartment_area: apartment_area ? String(apartment_area) : '',
            bathrooms: String(Array.from(bathrooms)[0]),
            bedrooms: String(Array.from(bedrooms)[0]),
            built: {
                start: {
                    year: built?.start?.year,
                    month: built?.start?.month,
                    day: built?.start?.day,
                },
                end: {
                    year: built?.end?.year,
                    month: built?.end?.month,
                    day: built?.end?.day,
                },
            },
            parking_places: Array.from(parking_places)[0] ? String(Array.from(parking_places)[0]) : '',
            pets_allowed: pets_allowed,
        },
        amenities: amenities,
        first_name: first_name,
        sure_name: sure_name,
        email: email,
        phone: phone,
        modifiedAt: serverTimestamp()
    }

    // console.log("payload", payload);


    const uploadImagesToStorage = async (files) => {
        const uploadPromises = files.map(async file => {
            const bannerFilename = `${Date.now()}.${file.name.split('.').pop()}`;
            const storageRef = ref(firebaseStorage, `/media/properties/images/${bannerFilename}`);
            const snapshot = await uploadBytes(storageRef, file);
            return await getDownloadURL(snapshot.ref);
        });
        return Promise.all(uploadPromises);
    };


    // Submit Form
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (images?.length !== 8) {
            toast.error("Please upload total 8 images.");
            return;
        }

        try {
            setLoading(true);
            let bannerURL = '';
            if (banner) {
                // Upload banner image
                const bannerFilename = `${Date.now()}.${banner.name.split('.').pop()}`;
                const bannerRef = ref(firebaseStorage, `/media/properties/banner/${bannerFilename}`);
                const bannerSnapshot = await uploadBytes(bannerRef, banner);
                bannerURL = await getDownloadURL(bannerSnapshot.ref);
            }

            // // Upload multiple images
            // const uploadPromises = images.map(async (file) => {
            //     const newFilename = `${Date.now()}-${file.name}`;
            //     const imagesRef = ref(firebaseStorage, `/media/properties/images/${newFilename}`);
            //     const snapshot = await uploadBytes(imagesRef, file);
            //     return await getDownloadURL(snapshot.ref);
            // });

            // const imageUrls = await Promise.all(uploadPromises);

            // Separate new and existing images
            const newImages = images.filter(image => image instanceof File);
            const existingImages = images.filter(image => !(image instanceof File)).map(image => image.url);

            let newImageUrls = [];
            if (newImages.length > 0) {
                newImageUrls = await uploadImagesToStorage(newImages);
            }

            const finalImageUrls = [...existingImages, ...newImageUrls];

            // Prepare form data
            const formData = {
                ...payload,
                ...banner ? { banner: bannerURL } : {},
                images: finalImageUrls,
            };

            const docRef = await updateDoc(doc(firebaseDB, "properties", params?.editId), formData);
            toast.success("Form Submitted Successfully", {
                description: 'Our team will contact you shortly.',
            });
        } catch (error) {
            console.error("Error updating document: ", error);
            toast.error("Error updating document", {
                description: 'Please try again later.',
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className='relative bg-gray-50 dark:bg-black'>
                <div className='max-w-7xl mx-auto w-full px-4 relative py-3 md:py-10'>
                    <div className='flex flex-wrap md:gap-0 gap-5'>
                        <form onSubmit={handleSubmit} validationBehavior="native" className={`md:w-7/12 w-full md:pe-4 ${loading ? "pointer-events-none" : ""}`}>
                            <div className='bg-white shadow-md rounded-md dark:bg-slate-900 p-4 md:p-6'>
                                <div className='text-lg md:text-2xl pb-3 font-bold text-black dark:text-white flex items-center gap-2'> <span className='flex items-center'><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 20 20" aria-hidden="true" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg></span> Basic info</div>

                                <div className="flex w-full flex-wrap md:flex-nowrap flex-col gap-4">

                                    <div className="mb-4 sm:col-span-2">
                                        <div className="flex items-center justify-center w-full relative">
                                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-900 bg-contain bg-no-repeat bg-center" style={banner ? { backgroundImage: `url(${URL.createObjectURL(banner)})` } : { backgroundImage: `url(${initialBanner})` }}>
                                                <div className={`flex flex-col items-center justify-center pt-5 pb-6 backdrop-blur-lg size-full group/opacity hover:opacity-100 ${(banner || initialBanner) ? 'opacity-0 bg-gray-900/50' : ''}`}>
                                                    <UploadIcon className="size-6 text-gray-500 group-[.opacity-0]/opacity:text-gray-100 dark:text-gray-400" />
                                                    <p className="mb-2 text-base text-gray-500 group-[.opacity-0]/opacity:text-gray-100 dark:text-gray-400"><span className="font-bold">Upload Banner</span></p>
                                                    <p className="mb-2 text-sm text-gray-500 group-[.opacity-0]/opacity:text-gray-100 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                    <p className="text-xs text-gray-500 group-[.opacity-0]/opacity:text-gray-100 dark:text-gray-400">WEBP, AVIF, PNG, JPG or GIF (MAX. 800x400px)</p>
                                                </div>
                                                <input
                                                    id="dropzone-file"
                                                    type="file"
                                                    className="hidden"
                                                    onChange={handleBannerChange}
                                                    ref={bannerFileRef}
                                                    accept="image/*"
                                                />
                                            </label>
                                            {banner && (
                                                <div className="absolute top-2 right-2 z-50">
                                                    <Button color="error" className="min-w-0 p-2" startContent={<DeleteIcon className="size-6" />} onClick={handleRemoveBanner}></Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className='w-full'>
                                        <Input
                                            type="text"
                                            variant="underlined"
                                            label="Title"
                                            isRequired={true}
                                            validationBehavior="native"
                                            value={title}
                                            onValueChange={setTitle}
                                        />
                                    </div>

                                    <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
                                        <Select
                                            variant="underlined"
                                            label="Property type"
                                            disallowEmptySelection
                                            isRequired={true}
                                            validationBehavior="native"
                                            errorMessage
                                            className=""
                                            selectedKeys={new Set([type.id])}
                                            onSelectionChange={handleTypeChange}
                                        >
                                            {propertyTypeCollaction && propertyTypeCollaction?.map((item) => (
                                                <SelectItem key={item?.id}>
                                                    {item?.type}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                        <Select
                                            variant="underlined"
                                            label="Condition"
                                            disallowEmptySelection
                                            isRequired={true}
                                            validationBehavior="native"
                                            className=""
                                            selectedKeys={condition}
                                            onSelectionChange={setCondition}
                                        >
                                            {conditionCollaction && conditionCollaction?.map((item) => (
                                                <SelectItem key={item?.key}>
                                                    {item?.label}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </div>

                                    <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
                                        <Checkbox isSelected={isVarified} onValueChange={setIsVarified} validationBehavior="native">
                                            Property has been inspected
                                        </Checkbox>
                                    </div>
                                </div>
                            </div>
                            <div className='bg-white shadow-md rounded-md dark:bg-slate-900 p-4 md:p-6 my-8'>
                                <div className='text-lg md:text-2xl pb-3 font-bold text-black dark:text-white flex items-center gap-2'> <span className='flex items-center'><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"></path></svg></span> Location</div>

                                <div className="flex w-full flex-wrap md:flex-nowrap flex-col  gap-4">
                                    <div className="w-full flex flex-col gap-4">
                                        <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
                                            <Select
                                                variant="underlined"
                                                label="Area"
                                                disallowEmptySelection
                                                isRequired={true}
                                                validationBehavior="native"
                                                className=""
                                                selectedKeys={new Set([area.id])}
                                                onSelectionChange={handleAreaChange}
                                            >
                                                {locationsCollaction && locationsCollaction?.map((item) => (
                                                    <SelectItem key={item?.id}>
                                                        {item?.location}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="w-full flex flex-wrap g-4">
                                        <Input
                                            label="Full Address"
                                            type="text"
                                            variant="underlined"
                                            isRequired={true}
                                            validationBehavior="native"
                                            value={fullAddress}
                                            onValueChange={setFullAddress}
                                        />
                                    </div>

                                </div>
                            </div>
                            <div className='bg-white shadow-md rounded-md dark:bg-slate-900 p-4 md:p-6 my-8'>
                                <div className='text-lg md:text-2xl pb-3 font-bold text-black dark:text-white flex items-center gap-2'> <span className='flex items-center'><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M402.3 344.9l32-32c5-5 13.7-1.5 13.7 5.7V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V112c0-26.5 21.5-48 48-48h273.5c7.1 0 10.7 8.6 5.7 13.7l-32 32c-1.5 1.5-3.5 2.3-5.7 2.3H48v352h352V350.5c0-2.1.8-4.1 2.3-5.6zm156.6-201.8L296.3 405.7l-90.4 10c-26.2 2.9-48.5-19.2-45.6-45.6l10-90.4L432.9 17.1c22.9-22.9 59.9-22.9 82.7 0l43.2 43.2c22.9 22.9 22.9 60 .1 82.8zM460.1 174L402 115.9 216.2 301.8l-7.3 65.3 65.3-7.3L460.1 174zm64.8-79.7l-43.2-43.2c-4.1-4.1-10.8-4.1-14.8 0L436 82l58.1 58.1 30.9-30.9c4-4.2 4-10.8-.1-14.9z"></path></svg></span> Property details</div>

                                <div className="flex w-full flex-wrap md:flex-nowrap flex-col  gap-4">
                                    <div className="w-full flex flex-col gap-4">
                                        <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
                                            <Input
                                                type="tel"
                                                variant="underlined"
                                                label="Total area, sq.m "
                                                isRequired={true}
                                                validationBehavior="native"
                                                value={apartment_area}
                                                onValueChange={setApartment_area}
                                            />
                                            <Select
                                                variant="underlined"
                                                label="Bedrooms"
                                                disallowEmptySelection
                                                isRequired={true}
                                                validationBehavior="native"
                                                selectedKeys={bedrooms}
                                                onSelectionChange={setBedrooms}
                                            >
                                                {bedroomsCollaction.map((item) => (
                                                    <SelectItem key={item.key}>
                                                        {item.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
                                        <Select
                                            variant="underlined"
                                            label="Bathrooms"
                                            disallowEmptySelection
                                            isRequired={true}
                                            validationBehavior="native"
                                            className=""
                                            selectedKeys={bathrooms}
                                            onSelectionChange={setBathrooms}
                                        >
                                            {bathroomsCollaction.map((Bathroom) => (
                                                <SelectItem key={Bathroom.key}>
                                                    {Bathroom.label}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            variant="underlined"
                                            label="Parking spots"
                                            disallowEmptySelection
                                            isRequired={true}
                                            validationBehavior="native"
                                            className=""
                                            selectedKeys={parking_places}
                                            onSelectionChange={setParking_places}
                                        >
                                            {parkingspotsCollaction.map((parking) => (
                                                <SelectItem key={parking.key}>
                                                    {parking.label}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                    </div>
                                    <div className='w-full flex flex-col gap-4 py-4'>
                                        <CheckboxGroup
                                            label="Select Amenities"
                                            orientation="horizontal"
                                            color="primary"
                                            value={amenities}
                                            onValueChange={setAmenities}
                                            classNames={{
                                                base: "base-classes",
                                                label: "label-classes",
                                                wrapper: "wrapper-classes grid md:grid-cols-3 grid-cols-2 gap-4",
                                            }}
                                        >

                                            {amenitiesCollaction && amenitiesCollaction?.map((item) => (
                                                <Checkbox value={item?.label} key={item?.id}>
                                                    {item?.label}
                                                </Checkbox>
                                            ))}
                                        </CheckboxGroup>
                                    </div>
                                    <div className="w-full flex flex-col gap-4 pb-4">
                                        <CheckboxGroup
                                            label="Pets Allow"
                                            orientation="horizontal"
                                            color="primary"
                                            value={pets_allowed}
                                            onValueChange={setPets_allowed}
                                            classNames={{
                                                base: "base-classes",
                                                label: "label-classes",
                                                wrapper: "wrapper-classes grid md:grid-cols-3 grid-cols-2 gap-4",
                                            }}
                                        >
                                            <Checkbox value={'cats'} key={'cats'}>
                                                Cats allowed
                                            </Checkbox>
                                            <Checkbox value={'dogs'} key={'dogs'}>
                                                Dogs allowed
                                            </Checkbox>
                                        </CheckboxGroup>

                                    </div>
                                    <div>
                                        <Textarea
                                            variant="underlined"
                                            label="Description"
                                            labelPlacement="outside"
                                            isRequired={true}
                                            validationBehavior="native"
                                            className="col-span-12 md:col-span-6 mb-6 md:mb-0"
                                            value={overview}
                                            onValueChange={setOverview}
                                        />
                                    </div>

                                    <div className="w-full flex flex-col gap-y-2">
                                        <DateRangePicker
                                            label="Build Date (From - To)"
                                            variant='underlined'
                                            // visibleMonths={3}
                                            value={built}
                                            showMonthAndYearPickers
                                            isRequired={true}
                                            validationBehavior="native"
                                            onChange={setBuilt}
                                            maxValue={today(getLocalTimeZone())}
                                        />
                                        <p className="text-default-500 text-sm">
                                            Selected date:{" "}
                                            {built
                                                ? formatter.formatRange(
                                                    built.start.toDate(getLocalTimeZone()),
                                                    built.end.toDate(getLocalTimeZone()),
                                                )
                                                : "--"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className='bg-white shadow-md rounded-md dark:bg-slate-900 p-4 md:p-6 my-8'>
                                <div className='text-lg md:text-2xl pb-3 font-bold text-black dark:text-white flex items-center gap-2'> <span className='flex items-center'><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448 183.8v-123A44.66 44.66 0 0 0 403.29 16H280.36a30.62 30.62 0 0 0-21.51 8.89L13.09 270.58a44.86 44.86 0 0 0 0 63.34l117 117a44.84 44.84 0 0 0 63.33 0l245.69-245.61A30.6 30.6 0 0 0 448 183.8zM352 144a32 32 0 1 1 32-32 32 32 0 0 1-32 32z"></path><path d="M496 64a16 16 0 0 0-16 16v127.37L218.69 468.69a16 16 0 1 0 22.62 22.62l262-262A29.84 29.84 0 0 0 512 208V80a16 16 0 0 0-16-16z"></path></svg></span>Price</div>

                                <div className="flex w-full flex-wrap md:flex-nowrap flex-col  gap-4">
                                    <div className="w-full flex flex-col gap-4">
                                        <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
                                            <Input
                                                type="tel"
                                                variant="underlined"
                                                label="Price"
                                                isRequired={true}
                                                validationBehavior="native"
                                                value={sale_price}
                                                onValueChange={setSale_price}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='bg-white shadow-md rounded-md dark:bg-slate-900 p-4 md:p-6 my-8'>
                                <div className='text-lg md:text-2xl pb-3 font-bold text-black dark:text-white flex items-center gap-2'> <span className='flex items-center'><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M608 0H160a32 32 0 0 0-32 32v96h160V64h192v320h128a32 32 0 0 0 32-32V32a32 32 0 0 0-32-32zM232 103a9 9 0 0 1-9 9h-30a9 9 0 0 1-9-9V73a9 9 0 0 1 9-9h30a9 9 0 0 1 9 9zm352 208a9 9 0 0 1-9 9h-30a9 9 0 0 1-9-9v-30a9 9 0 0 1 9-9h30a9 9 0 0 1 9 9zm0-104a9 9 0 0 1-9 9h-30a9 9 0 0 1-9-9v-30a9 9 0 0 1 9-9h30a9 9 0 0 1 9 9zm0-104a9 9 0 0 1-9 9h-30a9 9 0 0 1-9-9V73a9 9 0 0 1 9-9h30a9 9 0 0 1 9 9zm-168 57H32a32 32 0 0 0-32 32v288a32 32 0 0 0 32 32h384a32 32 0 0 0 32-32V192a32 32 0 0 0-32-32zM96 224a32 32 0 1 1-32 32 32 32 0 0 1 32-32zm288 224H64v-32l64-64 32 32 128-128 96 96z"></path></svg></span>Photos / video</div>

                                <div className="flex w-full flex-wrap md:flex-nowrap flex-col  gap-4">
                                    <div className="w-full flex flex-col gap-4">
                                        <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
                                            <label htmlFor="file-input" className="sr-only">Choose file</label>
                                            <input
                                                type="file"
                                                name="file-input"
                                                id="file-input"
                                                variant="underlined"
                                                ref={imagesFileRef}
                                                multiple
                                                accept="image/*"
                                                onChange={handleImagesChange}
                                                onClick={handleFileInputClick}
                                                onBlur={handleFileInputBlur}
                                                isRequired={true}
                                                validationBehavior="native"
                                                className="block w-full border border-gray-200 shadow-sm rounded-lg text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400
                                                    file:bg-gray-50 file:border-0
                                                    file:me-4
                                                    file:py-3 file:px-4
                                                    dark:file:bg-gray-700 dark:file:text-gray-400"/>
                                        </div>
                                        <div className="mt-2 grid xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-2">
                                            {images.map((image, index) => (
                                                <Card key={index} className="relative bg-gray-50 dark:bg-gray-800">
                                                    <CardBody>
                                                        {image instanceof File ? (
                                                            <Image src={URL.createObjectURL(image)} alt={`Preview ${index}`} width={400} height={400} className="w-full aspect-square object-cover rounded" />
                                                        ) : (
                                                            <Image src={image?.url} alt={image?.name} width={400} height={400} className="w-full aspect-square object-cover rounded" />
                                                        )}
                                                        <Button
                                                            color="danger"
                                                            variant={'solid'}
                                                            onClick={() => handleRemoveImage(image.name)}
                                                            radius='full'
                                                            className="absolute bg-rose-800 top-2 right-2 flex items-center justify-center p-0 !min-h-0 min-w-0 !size-6"
                                                            startContent={<DeleteIcon className="size-4" />}
                                                        ></Button>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='bg-white shadow-md rounded-md dark:bg-slate-900 p-4 md:p-6 my-8'>
                                <div className='text-lg md:text-2xl pb-3 font-bold text-black dark:text-white flex items-center gap-2'> <span className='flex items-center'><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M280 0C408.1 0 512 103.9 512 232c0 13.3-10.7 24-24 24s-24-10.7-24-24c0-101.6-82.4-184-184-184c-13.3 0-24-10.7-24-24s10.7-24 24-24zm8 192a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm-32-72c0-13.3 10.7-24 24-24c75.1 0 136 60.9 136 136c0 13.3-10.7 24-24 24s-24-10.7-24-24c0-48.6-39.4-88-88-88c-13.3 0-24-10.7-24-24zM117.5 1.4c19.4-5.3 39.7 4.6 47.4 23.2l40 96c6.8 16.3 2.1 35.2-11.6 46.3L144 207.3c33.3 70.4 90.3 127.4 160.7 160.7L345 318.7c11.2-13.7 30-18.4 46.3-11.6l96 40c18.6 7.7 28.5 28 23.2 47.4l-24 88C481.8 499.9 466 512 448 512C200.6 512 0 311.4 0 64C0 46 12.1 30.2 29.5 25.4l88-24z"></path></svg></span> Contacts</div>

                                <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-3 gap-4">

                                    <Input
                                        type="text"
                                        variant="underlined"
                                        label="First name"
                                        isRequired={true}
                                        validationBehavior="native"
                                        value={first_name}
                                        onValueChange={setFirst_name}
                                    />
                                    <Input
                                        type="text"
                                        variant="underlined"
                                        label="Sure name"
                                        isRequired={true}
                                        validationBehavior="native"
                                        value={sure_name}
                                        onValueChange={setSure_name}
                                    />
                                </div>
                                <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-3 gap-4">

                                    <Input
                                        type="email"
                                        variant="underlined"
                                        label="Email"
                                        isRequired={true}
                                        validationBehavior="native"
                                        value={email}
                                        onValueChange={setEmail}
                                    />
                                    <Input
                                        type="tel"
                                        variant="underlined"
                                        label="Phone number"
                                        isRequired={true}
                                        validationBehavior="native"
                                        value={phone}
                                        onValueChange={setPhone}
                                    />
                                </div>

                            </div>

                            <div className='flex items-center gap-4'>
                                <Button color="primary" variant="solid" type="submit" isLoading={loading} startContent={!loading && <CheckCircleIcon className="size-5" />} className='w-full font-bold'>
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                        <div className='md:w-5/12 w-full md:ps-4 max-md:sticky max-md:bottom-4 z-40'>
                            <div className='bg-white shadow-md rounded-md dark:bg-slate-900 px-4 py-2 max-md:border-1 max-md:border-gray-300 md:p-6 sticky top-10'>
                                <div>
                                    <Progress
                                        size="sm"
                                        radius="sm"
                                        classNames={{
                                            base: "max-w-md",
                                            track: "drop-shadow-md border border-default",
                                            indicator: "bg-gradient-to-r from-pink-500 to-yellow-500",
                                            label: "tracking-wider font-medium text-default-600",
                                            value: "text-foreground/60",
                                        }}
                                        label="Content filled"
                                        value={progress}
                                        showValueLabel={true}
                                    />
                                </div>

                                <div className='mt-5 max-md:hidden'>
                                    <div className={`flex items-center text-base gap-3 ${basicInfoProgress ? "text-gray-900 dark:text-gray-50" : "text-gray-500 dark:text-gray-400"}`}><span className={`flex items-center ${basicInfoProgress ? "text-success-500" : "text-gray-500"}`}><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"></path></svg></span> Basic info</div>
                                    <div className={`flex items-center text-base gap-3 ${locationProgress ? "text-gray-900 dark:text-gray-50" : "text-gray-500 dark:text-gray-400"}`}><span className={`flex items-center ${locationProgress ? "text-success-500" : "text-gray-500"}`}><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"></path></svg></span> Location</div>
                                    <div className={`flex items-center text-base gap-3 ${propertyDetailsProgress ? "text-gray-900 dark:text-gray-50" : "text-gray-500 dark:text-gray-400"}`}><span className={`flex items-center ${propertyDetailsProgress ? "text-success-500" : "text-gray-500"}`}><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"></path></svg></span> Property details</div>
                                    <div className={`flex items-center text-base gap-3 ${priceProgress ? "text-gray-900 dark:text-gray-50" : "text-gray-500 dark:text-gray-400"}`}><span className={`flex items-center ${priceProgress ? "text-success-500" : "text-gray-500"}`}><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"></path></svg></span> Price</div>
                                    <div className={`flex items-center text-base gap-3 ${imagesProgress ? "text-gray-900 dark:text-gray-50" : "text-gray-500 dark:text-gray-400"}`}><span className={`flex items-center ${imagesProgress ? "text-success-500" : "text-gray-500"}`}><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"></path></svg></span> Photos / video</div>
                                    <div className={`flex items-center text-base gap-3 ${contactsProgress ? "text-gray-900 dark:text-gray-50" : "text-gray-500 dark:text-gray-400"}`}><span className={`flex items-center ${contactsProgress ? "text-success-500" : "text-gray-500"}`}><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"></path></svg></span>
                                        Contacts</div>


                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </>
    )
}

export default EditPage