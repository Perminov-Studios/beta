"use client";

import { useEffect, useState, useMemo } from "react";

import Footer from "./componets/footer.jsx";

import {
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Link,
  Telegram,
  Tiktok,
  Twitter,
  X,
  YoutubeSolid,
  Divide
} from "iconoir-react";

import { MeshGradient } from "@paper-design/shaders-react";

import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { ArrowRightFromSquare, Gear, Persons, Plus, FolderOpen } from "@gravity-ui/icons";
import {
  Dropdown,
  Button,
  Label,
  Avatar,
  Card,
  TagGroup,
  Tag,
  Separator,
  Breadcrumbs,
  Tabs,
  Chip,
  Tooltip,
  Modal
} from "@heroui/react";
import { Navbar, NumberValue, EmptyState, Stepper, DropZone } from "@heroui-pro/react";
import { toast } from "@heroui/react";
import {
  clearAuthSession,
  getAuthSession,
  imagesApi,
  usersApi,
} from "../../apiroutes.jsx";

import "../App.css";
import "./css/UserPage.css";
/*import { Tooltip } from "react-aria-components";*/


const DEFAULT_LOGO =
  "/mainLogo.png";
const DEFAULT_AVATAR =
  "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/2ebf8227-a46c-43e3-8ff8-1e32499b5f02/dm4hnfk-f5701158-5111-4db6-8327-0e2e0cec487f.jpg/v1/fill/w_894,h_894,q_70,strp/fake_tiktok_default_pfp_by_pfpideasdaily_dm4hnfk-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MjA0OCIsInBhdGgiOiIvZi8yZWJmODIyNy1hNDZjLTQzZTMtOGZmOC0xZTMyNDk5YjVmMDIvZG00aG5may1mNTcwMTE1OC01MTExLTRkYjYtODMyNy0wZTJlMGNlYzQ4N2YuanBnIiwid2lkdGgiOiI8PTIwNDgifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.NwvtSNO5Kn1nYfS-QMn_Lh3RSQM83U0fGPB9-pxoflI";
{/*
const DEFAULT_BANNER = {
  width: 1280,
  height: 720,
  image: "https://res.cloudinary.com/dto1j808n/image/upload/v1778183051/download_ybkyck.webp",
  colorBack: "#8f8f8f00",
  colorHighlight: "#ffffff",
  highlights: 0.07,
  layering: 0,
  edges: 0.8,
  waves: 0.3,
  caustic: 0.1,
  size: 1,
  speed: 0.28,
  scale: 1.36,
  fit: "cover",
}; */}

const DEFAULT_BANNER = {
  width: "100%",
  height: "100%",
  colors: ["#0051ff", "#000000", "#000000", "#000000"],
  distortion: 0.47,
  swirl: 0.2,
  grainMixer: 0,
  grainOverlay: 0.19,
  speed: 0.5,
  style: {
    position: 'absolute',
    inset: 0,
    zIndex: -1,
  },
}

const steps = [
  { description: "Upload your work", title: "Upload" },
  { description: "Add details to your work", title: "Finalize" },
];

const capitalize = (value) => {
  if (!value) return "Member";
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
};

const buildInitials = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "U";

  return parts
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const normalizeTags = (tags) =>
  Array.isArray(tags) ? tags.map((tag) => String(tag)) : [];

const normalizeProfile = (rawUser) => {
  if (!rawUser) return null;

  const firstName = String(rawUser.firstName || "").trim();
  const lastName = String(rawUser.lastName || "").trim();
  const displayName = String(rawUser.displayName || "").trim();
  const username = String(rawUser.username || "").trim();
  const name =
    displayName ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    username ||
    "User";

  return {
    ...rawUser,
    name,
    title: capitalize(rawUser.role || "member"),
    avatar: rawUser.avatar || DEFAULT_AVATAR,
    banner: rawUser.banner || DEFAULT_BANNER,
    initials: buildInitials(name),
    tags: normalizeTags(rawUser.tags),
  };
};

const formatTagLabel = (tag) => {
  const normalizedTag = String(tag || "").trim();
  if (!normalizedTag) return "";

  const lowerTag = normalizedTag.toLowerCase();
  if (
    lowerTag === "prouser" ||
    lowerTag === "pro-user" ||
    lowerTag === "pro_user"
  ) {
    return "Pro User";
  }

  return normalizedTag.charAt(0).toUpperCase() + normalizedTag.slice(1);
};

const formatLinkLabel = (link) => {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return (
      String(link)
        .replace(/^https?:\/\//, "")
        .split("/")[0] || String(link)
    );
  }
};

const getSocialLinkMeta = (link) => {
  const normalizedLink = String(link || "").toLowerCase();

  if (
    normalizedLink.includes("facebook.com") ||
    normalizedLink.includes("fb.com")
  ) {
    return {
      className: "socialLink facebook",
      label: "Facebook",
      Icon: Facebook,
    };
  }

  if (normalizedLink.includes("instagram.com")) {
    return {
      className: "socialLink instagram",
      label: "Instagram",
      Icon: Instagram,
    };
  }

  if (normalizedLink.includes("linkedin.com")) {
    return {
      className: "socialLink linkedin",
      label: "LinkedIn",
      Icon: Linkedin,
    };
  }

  if (
    normalizedLink.includes("x.com") ||
    normalizedLink.includes("twitter.com")
  ) {
    return {
      className: "socialLink x",
      label: "X",
      Icon: normalizedLink.includes("twitter.com") ? Twitter : X,
    };
  }

  if (
    normalizedLink.includes("youtube.com") ||
    normalizedLink.includes("youtu.be")
  ) {
    return {
      className: "socialLink youtube",
      label: "YouTube",
      Icon: YoutubeSolid,
    };
  }

  if (normalizedLink.includes("tiktok.com")) {
    return {
      className: "socialLink tiktok",
      label: "TikTok",
      Icon: Tiktok,
    };
  }

  if (normalizedLink.includes("github.com")) {
    return {
      className: "socialLink github",
      label: "GitHub",
      Icon: Github,
    };
  }

  if (
    normalizedLink.includes("telegram.me") ||
    normalizedLink.includes("t.me") ||
    normalizedLink.includes("telegram.com")
  ) {
    return {
      className: "socialLink telegram",
      label: "Telegram",
      Icon: Telegram,
    };
  }

  return {
    className: "socialLink",
    label: formatLinkLabel(link),
    Icon: Link,
  };
};

const normalizeExternalUrl = (value) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return null;

  const candidate = /^https?:\/\//i.test(rawValue)
    ? rawValue
    : `https://${rawValue}`;

  try {
    const parsedUrl = new URL(candidate);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
};

const openExternalLink = (value) => {
  const safeUrl = normalizeExternalUrl(value);

  if (!safeUrl) {
    toast.warning("This link is unavailable.");
    return;
  }

  if (typeof window === "undefined") return;

  window.open(safeUrl, "_blank", "noopener,noreferrer");
};

const openMailClient = (email) => {
  const normalizedEmail = String(email || "").trim();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    toast.warning("No email address is available.");
    return;
  }

  if (typeof window === "undefined") return;

  window.location.href = `mailto:${normalizedEmail}`;
};


export default function AppNavbar() {
  const navigate = useNavigate();
  const initialSession = getAuthSession();
  const sessionToken = initialSession?.token || null;

  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const [profile, setProfile] = useState(() =>
    normalizeProfile(initialSession?.user),
  );
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(
    Boolean(sessionToken && !initialSession?.user),
  );
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [step, setStep] = useState(0);
  const totalSteps = steps.length;

  useEffect(() => {
    let cancelled = false;

    if (!sessionToken) {
      navigate("/login", { replace: true });
      return undefined;
    }

    const loadProfile = async () => {
      setIsLoading(true);

      try {
        const currentUser = await usersApi.getMe(sessionToken);
        if (cancelled) return;
        setProfile(normalizeProfile(currentUser));
      } catch (error) {
        if (cancelled) return;

        const status = error?.status;
        if (status === 401 || status === 403) {
          cancelled = true;
          clearAuthSession();
          toast.warning("Your session expired. Please sign in again.");
          navigate("/login", { replace: true });
          return;
        }

        const message =
          error?.data?.error ||
          error?.message ||
          "Unable to load your profile.";
        setLoadError(message);
        toast.danger(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [navigate, sessionToken]);

  useEffect(() => {
    let cancelled = false;

    if (!sessionToken) {
      setImages([]);
      return undefined;
    }

    const loadImages = async () => {
      setIsLoadingImages(true);

      try {
        const response = await imagesApi.listMine({}, sessionToken);
        if (cancelled) return;

        const items = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.images)
              ? response.images
              : Array.isArray(response?.items)
                ? response.items
                : [];

        setImages(items);
      } finally {
        if (!cancelled) {
          setIsLoadingImages(false);
        }
      }
    };

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  const handleMenuAction = (actionKey) => {
    if (String(actionKey) !== "logout") return;

    clearAuthSession();
    toast.success("Logged out successfully.");
    navigate("/login", { replace: true });
  };

  if (!sessionToken) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="space-y-2 p-6 text-center">
          <h2 className="text-lg font-semibold">Redirecting to login</h2>
          <p className="text-sm text-muted">
            Please sign in to view your profile.
          </p>
        </Card>
      </div>
    );
  }

  if (isLoading && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="space-y-2 p-6 text-center">
          <h2 className="text-lg font-semibold">Loading profile</h2>
          <p className="text-sm text-muted">Fetching your account details...</p>
        </Card>
      </div>
    );
  }

  const userName = profile?.name || "Your profile";
  const userEmail = profile?.email || "Loading...";
  const userTitle = "Web Developer";
  const userAvatar = profile?.avatar || DEFAULT_AVATAR;
  const userBanner = profile?.banner || DEFAULT_BANNER; {/* profile?.banner ||  */ }
  const hasImageBanner = typeof userBanner === "string";
  const waterBannerProps = hasImageBanner
    ? null
    : {
      ...userBanner,
      width: "100%",
      height: "100%",
    };
  const userInitials = profile?.initials || "U";
  const userBio = profile?.bio || "No bio available yet. This user hasn't shared anything about themselves. Stay tuned for updates! Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
  const userTags = Array.isArray(profile?.tags) ? profile.tags : [];
  const defaultSocialLinks = [
    "linkedin.com/in/example",
    "github.com/example",
    "twitter.com/example",
    "facebook.com/example",
    "instagram.com/example",
  ];
  const userSkills = [
    "JavaScript",
    "React",
    "Node.js",
    "CSS",
    "HTML",
    "TypeScript",
    "API Development",
    "Adobe Photoshop",
    "UI/UX Design",
    "Adobe Illustrator",
  ];
  const socialLinks = Array.isArray(profile?.socialLinks)
    ? profile.socialLinks.filter(Boolean)
    : defaultSocialLinks;

  const visibleSocialLinks = socialLinks.length > 0 ? socialLinks : defaultSocialLinks;

  const featuredImages = images.filter((image) => {
    if (!image || typeof image !== "object") return false;

    return Boolean(
      image.isFeatured ||
      image.featured ||
      image.featuredImage ||
      image.is_featured ||
      image.featured_image ||
      String(image.category || image.type || "").toLowerCase() === "featured",
    );
  });

  const hasFeaturedImages = featuredImages.length > 0;

  const processedTags = useMemo(() => {
    if (!Array.isArray(userTags)) return [];

    const tagsCopy = [...userTags];

    const hasAdmin = tagsCopy.some((tag) => {
      const value = typeof tag === 'string' ? tag : tag.name || tag.label || '';
      return value.toLowerCase() === 'admin';
    });

    const hasStaff = tagsCopy.some((tag) => {
      const value = typeof tag === 'string' ? tag : tag.name || tag.label || '';
      return value.toLowerCase() === 'staff';
    });

    // If user is Admin, ensure they also have Staff tag
    if (hasAdmin && !hasStaff) {
      tagsCopy.push('staff');
    }

    return tagsCopy;
  }, [userTags]);


  return (
    <>
      {loadError ? (
        <div className="mx-auto mt-4 w-[98%] rounded-3xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          {loadError}
        </div>
      ) : null}

      {/*
      <Navbar
        position="absolute"
        maxWidth="full"
        aria-label="Main navigation"
        className="UserNav"
        data-usal="fade-d duration-800 delay-300"
      >
        <Navbar.Header>
          <Navbar.MenuToggle className="md:hidden" />
          <Navbar.Brand>
            <Avatar className="rounded-lg logoAvatar" style={{ borderRadius: "0px", backgroundColor: "transparent" }}>
              <Avatar.Image alt="Logo" src={DEFAULT_LOGO} />
              <Avatar.Fallback delayMs={600}>{userInitials}</Avatar.Fallback>
            </Avatar>
          </Navbar.Brand>

          <Navbar.Content className="hidden md:flex">
            <Breadcrumbs>
              <Breadcrumbs.Item href="#">Home</Breadcrumbs.Item>
              <Breadcrumbs.Item href="#">Profile</Breadcrumbs.Item>
            </Breadcrumbs>
          </Navbar.Content>

          <Navbar.Spacer />

          <Navbar.Content className="hidden md:flex">
            <Navbar.Item>
              <Button
                variant="ghost"
                className="addProject"
                size="sm"
                onPress={() => setIsAddProjectOpen(true)}
              >
                <Plus className="size-3.5 plusIcon" />
                Add New Project
              </Button>
            </Navbar.Item>

            <div className="flex items-center" >
              <Dropdown>
                <Button
                  isIconOnly
                  aria-label={`Open account menu for ${userName}`}
                  className="rounded-full"
                  variant="ghost"
                >
                  <Avatar className="rounded-lg">
                    <Avatar.Image alt={userName} src={userAvatar} />
                    <Avatar.Fallback delayMs={600}>
                      {userInitials}
                    </Avatar.Fallback>
                  </Avatar>
                </Button>
                <Dropdown.Popover>
                  <div className="px-3 pb-1 pt-3">
                    <div className="flex items-center gap-2">
                      <Avatar size="sm" className="rounded-lg">
                        <Avatar.Image alt={userName} src={userAvatar} />
                        <Avatar.Fallback delayMs={600}>
                          {userInitials}
                        </Avatar.Fallback>
                      </Avatar>
                      <div className="flex flex-col gap-0">
                        <p className="text-sm font-medium leading-5">
                          {userName}
                        </p>
                        <p className="text-xs leading-none text-muted">
                          {userEmail}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Dropdown.Menu onAction={handleMenuAction}>
                    <Dropdown.Item id="dashboard" textValue="Dashboard">
                      <Label>Dashboard</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="profile" textValue="Profile">
                      <Label>Profile</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="settings" textValue="Settings">
                      <div className="flex w-full items-center justify-between gap-2">
                        <Label>Settings</Label>
                        <Gear className="size-3.5 text-muted" />
                      </div>
                    </Dropdown.Item>
                    <Dropdown.Item id="new-project" textValue="New project">
                      <div className="flex w-full items-center justify-between gap-2">
                        <Label>Create Team</Label>
                        <Persons className="size-3.5 text-muted" />
                      </div>
                    </Dropdown.Item>
                    <Dropdown.Item
                      id="logout"
                      textValue="Logout"
                      variant="danger"
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <Label>Log Out</Label>
                        <ArrowRightFromSquare className="size-3.5 text-danger" />
                      </div>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </div>
          </Navbar.Content>
        </Navbar.Header>

        <Navbar.Menu>
          <Navbar.MenuItem href="/features">Features</Navbar.MenuItem>
          <Navbar.MenuItem href="/pricing">Pricing</Navbar.MenuItem>
          <Navbar.MenuItem href="/docs">Docs</Navbar.MenuItem>
          <Navbar.MenuItem href="/user">Profile</Navbar.MenuItem>
          <Navbar.MenuItem href="/signup">Sign up</Navbar.MenuItem>
        </Navbar.Menu>
      </Navbar>
      */}

      <div className="UserHeader">

        <div className="UserHeaderMedia">
          {hasImageBanner ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 hasBanner"
              style={{
                //backgroundImage: `url(${userBanner})`,
                backgroundImage: `url("https://images.pexels.com/photos/11137989/pexels-photo-11137989.jpeg")`,
              }}
            />
          ) : (
            <MeshGradient
              aria-hidden="true"
              {...waterBannerProps}
            />
          )}
        </div>

        <div className="headerAvatar">
          <div className="ProUserTag">
            <TagGroup aria-label="User tags">
              <TagGroup.List className="flex gap-2 flex-wrap">
                {processedTags.map((tag) => {
                  const tagValue = typeof tag === 'string' ? tag : tag.name || tag.label || '';
                  const lowerTag = tagValue.toLowerCase();

                  let customClass = '';
                  let tagName = '';

                  if (lowerTag === 'pro') {
                    customClass = 'ProUser';
                    tagName = 'Studio ✚';

                  } else {
                    return null;
                  }

                  return (
                    <Tag
                      key={tag.id ?? tag._id ?? tagValue}
                      variant="outline"
                      className={customClass}
                    >
                      {tagName || formatTagLabel(tagValue)}
                    </Tag>
                  );
                })}
              </TagGroup.List>
            </TagGroup>
          </div>


          <div className="archL"></div>
          <div className="archR"></div>
          <Avatar size="xl" className="rounded-lg "
            style={{
              width: "100%",
              borderRadius: "20px",
              height: "100%",
              border: "4px solid #060607",
            }}
          >
            <Avatar.Image alt={userName} src={userAvatar} />
            <Avatar.Fallback delayMs={600}>{userInitials}</Avatar.Fallback>
          </Avatar>
        </div>

      </div>

      <div className="username">
        <h1 className="text-2xl font-bold">{userName}</h1>
      </div>

      <br />

      <div className="flex flex-wrap gap-4" style={{ width: "98%", margin: "0 auto" }}>
        <div className="userContent2 w-[300px] gap-4">
          <div className="w-full flex flex-row gap-3">
            <Button className="addProject w-[50%]">
              <Plus />
              Follow
            </Button>
            <Button variant="tertiary" className="text-white w-[50%]">
              Contact Me
            </Button>
          </div>
          <br />
          {/* create three column to show user stats */}
          <div className="w-full flex flex-row gap-4">
            <div className="flex flex-col w-[33.33%] items-center gap-1">
              <p className="text-lg font-semibold">12</p>
              <p className="text-sm text-muted">Projects</p>
            </div>
            <Separator orientation="vertical" />
            <div className="flex flex-col w-[33.33%] items-center gap-1">
              <p className="text-lg font-semibold">1.2K</p>
              <p className="text-sm text-muted">Followers</p>
            </div>
            <Separator orientation="vertical" />
            <div className="flex flex-col w-[33.33%] items-center gap-1">
              <p className="text-lg font-semibold">300</p>
              <p className="text-sm text-muted">Following</p>
            </div>
          </div>
          <br />
          {/* Create social link icons fetched from user data */}
          <div className="flex flex-row gap-3">
            {visibleSocialLinks.map((link) => {
              const { className, label, Icon } = getSocialLinkMeta(link);
              return (
                <Tooltip key={link} delay={0}>
                  <Button
                    variant="tertiary"
                    className={`${className} socialIcon`}
                    onClick={() => openExternalLink(link)}
                    aria-label={label}
                  >
                    <Icon className="size-5" />
                  </Button>
                  <Tooltip.Content showArrow placement="bottom">
                    {label}
                  </Tooltip.Content>
                </Tooltip>
              );
            })}
          </div>
        </div>
        <div className="userContent1 gap-2" style={{ flex: "1 1 0" }}>

          <div className="flex flex-row items-center gap-2 ml-auto" style={{
            position: "absolute",
            right: "45px",
          }}>

            <Modal isOpen={isAboutOpen} onOpenChange={setIsAboutOpen} className="z-[100]">
              <Button variant="outline" onPress={() => setIsAboutOpen(true)}>
                About Me
              </Button>

              <Modal.Backdrop variant="blur">
                <Modal.Container size="lg">
                  <Modal.Dialog className="sm:max-w-[720px]">
                    <Modal.CloseTrigger />

                    <Modal.Body>
                      <div className="flex flex-col gap-5">
                        <div>
                          <h2 className="text-lg font-semibold">Bio</h2>
                          <p className="text-sm text-muted">{userBio}</p>
                        </div>

                        <div>
                          <h2 className="text-lg font-semibold">Skills</h2>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {userSkills.map((skill) => (
                              <Chip key={skill} variant="outline">
                                {skill}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Modal.Body>

                    <Modal.Footer>
                      <Button slot="close" variant="secondary" onPress={() => setIsAboutOpen(false)}>
                        Close
                      </Button>
                    </Modal.Footer>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>

            <Button class="ml-auto" variant="outline" onClick={() => toast.info("CV download is not implemented in this demo.")}>
              Download my CV
            </Button>
          </div>
          <Tabs className="w-full max-w-none" defaultValue={hasFeaturedImages ? "featured" : "all"}>
            <Tabs.ListContainer className="max-w-md" >
              <div className="flex flex-row items-center gap-2 ">
                <Tabs.List aria-label="Options" style={{ background: "#0f0f12" }}>
                  {hasFeaturedImages ? (
                    <Tabs.Tab id="featured" className="new-accent-text">
                      Featured
                      <Tabs.Indicator className="new-accent" />
                    </Tabs.Tab>
                  ) : null}
                  <Tabs.Tab id="all" className="new-accent-text">
                    All Projects
                    <Tabs.Indicator className="new-accent" />
                  </Tabs.Tab>

                </Tabs.List>
              </div>
            </Tabs.ListContainer>
            {hasFeaturedImages ? (
              <Tabs.Panel className="pt-4" id="featured">
                <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center"
                  style={{ background: "#0f0f12", borderRadius: "12px" }}
                >
                  <Icon className="size-6 text-muted" icon="gravity-ui:tray" />
                  <span className="text-sm text-muted">No results found</span>
                </EmptyState>
              </Tabs.Panel>
            ) : null}
            <Tabs.Panel className="pt-4" id="all">
              <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center"
                style={{ background: "#0f0f12 ", borderRadius: "12px" }}
              >
                <Icon className="size-6 text-muted" icon="gravity-ui:tray" />
                <span className="text-sm text-muted">No results found</span>
              </EmptyState>
            </Tabs.Panel>
          </Tabs>
        </div>

      </div>

      <Footer />
      {/*
      
      <footer className="bg-[#0a0a0a] text-white" style={{
        width: "98%",
        margin: "40px auto 20px auto",
        borderRadius: "12px",
      }}>
      </footer>
      
      */}
    </>
  );
}
