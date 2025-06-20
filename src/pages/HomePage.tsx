
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, MessageSquare, Briefcase, ChevronRight, Star } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-700 text-white py-20">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-6 max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold">
              Your Legacy Continues Here
            </h1>
            <p className="text-lg md:text-xl opacity-90">
              Join our thriving alumni network to reconnect with classmates, discover career opportunities, 
              and contribute to the ongoing success of our prestigious institution.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button asChild size="lg" className="bg-white text-orange-600 hover:bg-gray-50 hover:scale-105 transition-all duration-300 shadow-lg">
                <Link to="/register">Join Our Community</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10 transition-all duration-300">
                <Link to="/login">Welcome Back</Link>
              </Button>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-orange-200 rounded-full opacity-30"></div>
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
              alt="Alumni" 
              className="rounded-lg shadow-xl w-[450px] h-auto relative z-10"
            />
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-orange-500 rounded-full opacity-30"></div>
          </div>
        </div>
      </header>

      {/* School Highlights */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-orange-600 font-medium uppercase tracking-wider">OUR LEGACY</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-gray-900">A Tradition of Excellence</h2>
            <div className="h-1 w-20 bg-orange-500 mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg">
              For over 75 years, our institution has been shaping leaders, innovators, and changemakers who make an impact worldwide.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Top-Ranked</h3>
              <p className="text-gray-600">
                Consistently ranked among the top educational institutions nationwide for academic excellence and student outcomes.
              </p>
            </div>

            <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Global Network</h3>
              <p className="text-gray-600">
                Join over 50,000 alumni across 75 countries who are changing the world in countless ways.
              </p>
            </div>

            <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Career Success</h3>
              <p className="text-gray-600">
                Our graduates achieve exceptional career trajectories with 95% employment within six months of graduation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Enhanced Design */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-orange-600 font-medium uppercase tracking-wider">ALUMNI BENEFITS</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-gray-900">Reconnect &amp; Grow Together</h2>
            <div className="h-1 w-20 bg-orange-500 mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg">
              Our platform offers everything you need to stay connected with your school community
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center hover:border-orange-300 hover:shadow-md transition-all duration-300">
              <div className="bg-orange-100 p-4 rounded-full mb-4">
                <Users className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-medium mb-2 text-gray-900">Alumni Directory</h3>
              <p className="text-gray-600">
                Find and reconnect with former classmates and teachers
              </p>
              <Button variant="ghost" size="sm" className="mt-4 text-orange-500 hover:text-orange-600 hover:bg-orange-50" asChild>
                <Link to="/register" className="flex items-center">
                  Explore <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center hover:border-orange-300 hover:shadow-md transition-all duration-300">
              <div className="bg-orange-100 p-4 rounded-full mb-4">
                <MessageSquare className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-medium mb-2 text-gray-900">Groups &amp; Events</h3>
              <p className="text-gray-600">
                Join interest groups and attend alumni events
              </p>
              <Button variant="ghost" size="sm" className="mt-4 text-orange-500 hover:text-orange-600 hover:bg-orange-50" asChild>
                <Link to="/register" className="flex items-center">
                  Join Now <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center hover:border-orange-300 hover:shadow-md transition-all duration-300">
              <div className="bg-orange-100 p-4 rounded-full mb-4">
                <GraduationCap className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-medium mb-2 text-gray-900">Mentorship</h3>
              <p className="text-gray-600">
                Connect with mentors or become one yourself
              </p>
              <Button variant="ghost" size="sm" className="mt-4 text-orange-500 hover:text-orange-600 hover:bg-orange-50" asChild>
                <Link to="/register" className="flex items-center">
                  Learn More <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center hover:border-orange-300 hover:shadow-md transition-all duration-300">
              <div className="bg-orange-100 p-4 rounded-full mb-4">
                <Briefcase className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-medium mb-2 text-gray-900">Job Board</h3>
              <p className="text-gray-600">
                Explore career opportunities shared by alumni
              </p>
              <Button variant="ghost" size="sm" className="mt-4 text-orange-500 hover:text-orange-600 hover:bg-orange-50" asChild>
                <Link to="/register" className="flex items-center">
                  View Jobs <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-orange-600 font-medium uppercase tracking-wider">ALUMNI VOICES</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-gray-900">What Our Community Says</h2>
            <div className="h-1 w-20 bg-orange-500 mx-auto mb-6"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 relative hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                <div className="text-orange-200 text-6xl opacity-50">"</div>
              </div>
              <p className="italic mb-6 text-gray-700">
                "The alumni network has been instrumental in my career growth. I've found mentors, job opportunities, and lifelong friends."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Sarah Johnson</h4>
                  <p className="text-sm text-gray-500">Class of 2015</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 relative hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                <div className="text-orange-200 text-6xl opacity-50">"</div>
              </div>
              <p className="italic mb-6 text-gray-700">
                "Being part of this alumni community keeps me connected to the school's values and the amazing people I met during my time there."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Michael Chen</h4>
                  <p className="text-sm text-gray-500">Class of 2008</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 relative lg:col-span-1 md:col-span-2 lg:col-auto hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                <div className="text-orange-200 text-6xl opacity-50">"</div>
              </div>
              <p className="italic mb-6 text-gray-700">
                "The mentorship program changed my life. I'm now giving back by mentoring recent graduates. It's a full-circle experience."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Alicia Rodriguez</h4>
                  <p className="text-sm text-gray-500">Class of 2010</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 max-w-3xl mx-auto">Ready to reconnect with your alma mater?</h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join our growing community of alumni and start building valuable connections today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-orange-600 hover:bg-gray-50 hover:scale-105 transition-all duration-300 shadow-lg">
              <Link to="/register">Join Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10 transition-all duration-300">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">AlumniConnect</h3>
              <p className="text-gray-300 mb-4">
                Connecting school communities since 2023
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-white hover:text-accent">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-accent">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-accent">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-accent">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-300 hover:text-white">About Us</Link></li>
                <li><Link to="/events" className="text-gray-300 hover:text-white">Events</Link></li>
                <li><Link to="/news" className="text-gray-300 hover:text-white">News</Link></li>
                <li><Link to="/donate" className="text-gray-300 hover:text-white">Support Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link to="/mentorship" className="text-gray-300 hover:text-white">Mentorship Program</Link></li>
                <li><Link to="/jobs" className="text-gray-300 hover:text-white">Job Board</Link></li>
                <li><Link to="/groups" className="text-gray-300 hover:text-white">Alumni Groups</Link></li>
                <li><Link to="/directory" className="text-gray-300 hover:text-white">Alumni Directory</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Contact</h4>
              <address className="not-italic text-gray-300">
                <p>1234 School Avenue</p>
                <p>City, State 12345</p>
                <p className="mt-2">Email: <a href="mailto:alumni@school.edu" className="hover:text-white">alumni@school.edu</a></p>
                <p>Phone: (123) 456-7890</p>
              </address>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            <div className="flex flex-wrap justify-center gap-6 mb-4">
              <Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>
              <Link to="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link>
              <Link to="/contact" className="text-gray-400 hover:text-white">Contact Us</Link>
            </div>
            <p>&copy; {new Date().getFullYear()} AlumniConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
