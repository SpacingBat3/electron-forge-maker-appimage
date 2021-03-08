export interface MakerAppImageConfigOptions {
    /**
     * Name of the package (e.g. atom), used in the Package field of the control
     * specification.
     *
     * Package names [...] must consist only of lower case letters (a-z), digits
     * (0-9), plus (+) and minus (-) signs, and periods (.). They must be at
     * least two characters long and must start with an alphanumeric character.
     */
    name?: string;
    /**
     * Name of the application (e.g. Atom), used in the Name field of the desktop specification.
     */
    productName?: string;
    /**
     * Generic name of the application (e.g. Text Editor), used in the GenericName field of the
     * desktop specification.
     */
    genericName?: string;
    /**
     * Version number of the package, used in the X-AppImage-Version field of the control specification.
     */
    version?: string;
    /**
     * Relative path to the executable that will act as binary for the application, used in the Exec
     * field of the desktop specification.
     *
     * Defaults to options.name
     */
    bin?: string;
    /**
     * Path to a single image that will act as icon for the application:
     */
    icon?: string;
    /**
     * Categories in which the application should be shown in a menu, used in the Categories field
     * of the desktop specification.
     *
     * Generated on https://specifications.freedesktop.org/menu-spec/latest/apa.html with:
     *
     * `(${$$('.informaltable tr td:first-child').map(td => `'${td.innerText}'`).join(' | ')})[]`
     */
    categories?: ('AudioVideo' | 'Audio' | 'Video' | 'Development' | 'Education' | 'Game' | 'Graphics' | 'Network' | 'Office' | 'Science' | 'Settings' | 'System' | 'Utility')[];
    /**
     * The absolute path to a custom template for the generated FreeDesktop.org desktop entry file.
     */
    // desktopTemplate?: string; // TODO
    /**
     * Compression algorithm used while making AppImages.
     */
    compression?: string;
}
  
export interface MakerAppImageConfig {
    template?: string;
    chmodChromeSandbox?: string;
    options?: MakerAppImageConfigOptions;
}